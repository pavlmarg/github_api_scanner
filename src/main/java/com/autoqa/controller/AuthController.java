package com.autoqa.controller;

import com.autoqa.dto.*;
import com.autoqa.entity.AuthProvider;
import com.autoqa.entity.PasswordResetToken;
import com.autoqa.entity.User;
import com.autoqa.repository.PasswordResetTokenRepository;
import com.autoqa.repository.UserRepository;
import com.autoqa.security.JwtUtil;
import com.autoqa.service.EmailService;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.UUID;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authManager;
    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final PasswordResetTokenRepository tokenRepository;
    private final EmailService emailService;

    @Value("${google.client.id}")
    private String googleClientId;

    // ==========================================
    // 1. STANDARD REGISTRATION & LOGIN
    // ==========================================



    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {

        if (!request.getPassword().equals(request.getConfirmPassword())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Passwords do not match"));
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", "An account with this email already exists."));
        }

        User user = new User();
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole("USER");

        try {
            userRepository.save(user);
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", "An account with this email already exists."));
        }

        return ResponseEntity.ok(Map.of("message", "User registered successfully"));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail()).orElse(null);
        
        if (user != null && user.getProvider() == AuthProvider.GOOGLE) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "This account is linked to Google. Please log in using the Google button."));
        }
        try {
            authManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
            );
        } catch (BadCredentialsException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Wrong account name or password."));
        } catch (AuthenticationException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Authentication failed. Please try again."));
        }

        String token = jwtUtil.generateToken(request.getEmail());

        return ResponseEntity.ok(new AuthResponse(token));
    }

    // ==========================================
    // 2. GOOGLE LOGIN / REGISTRATION
    // ==========================================

    @PostMapping("/google/signup")
    public ResponseEntity<?> googleSignup(@Valid @RequestBody GoogleLoginRequest request) {
        try {
            // Verify the Google Token
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), new GsonFactory())
                    .setAudience(Collections.singletonList(googleClientId))
                    .build();

            GoogleIdToken idToken = verifier.verify(request.getTokenId());
            if (idToken == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "Invalid Google token"));
            }

            String email = idToken.getPayload().getEmail();

            // Check if the user already exists
            if (userRepository.existsByEmail(email)) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body(Map.of("message", "An account with this email already exists. Please log in instead."));
            }

            // Create the new Google user
            User newUser = new User();
            newUser.setEmail(email);
            newUser.setProvider(AuthProvider.GOOGLE);
            newUser.setRole("USER");
            newUser.setPassword(passwordEncoder.encode(UUID.randomUUID().toString()));
            userRepository.save(newUser);

            // Generate JWT and return
            String appToken = jwtUtil.generateToken(email);
            return ResponseEntity.ok(new AuthResponse(appToken));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Google authentication failed. Please try again."));
        }
    }

    @PostMapping("/google/login")
    public ResponseEntity<?> googleLogin(@Valid @RequestBody GoogleLoginRequest request) {
        try {
            // Verify the Google Token
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), new GsonFactory())
                    .setAudience(Collections.singletonList(googleClientId))
                    .build();

            GoogleIdToken idToken = verifier.verify(request.getTokenId());
            if (idToken == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "Invalid Google token"));
            }

            String email = idToken.getPayload().getEmail();

            // Find the user in the database
            User user = userRepository.findByEmail(email).orElse(null);

            // Account must actually exist
            if (user == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "No account found for this Google email. Please sign up first."));
            }

            // Account must be registered via Google
            if (user.getProvider() != AuthProvider.GOOGLE) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "This email is registered with a password. Please log in using your email and password."));
            }

            // Generate JWT and return
            String appToken = jwtUtil.generateToken(email);
            return ResponseEntity.ok(new AuthResponse(appToken));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Google authentication failed. Please try again."));
        }
    }

    // ==========================================
    // 3. FORGOT / RESET PASSWORD
    // ==========================================

    @PostMapping("/forgot-password")
    @Transactional
    public ResponseEntity<?> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        User user = userRepository.findByEmail(request.getEmail()).orElse(null);
        
        // Always return OK to prevent email enumeration
        if (user == null) {
            return ResponseEntity.ok("If an account with that email exists, a reset link has been sent.");
        }

        tokenRepository.deleteByUser(user);

        String token = UUID.randomUUID().toString();
        PasswordResetToken resetToken = new PasswordResetToken();
        resetToken.setToken(token);
        resetToken.setUser(user);
        resetToken.setExpiryDate(LocalDateTime.now().plusMinutes(5));
        tokenRepository.save(resetToken);

        emailService.sendPasswordResetEmail(user.getEmail(), token);

        return ResponseEntity.ok("If an account with that email exists, a reset link has been sent.");
    }

    @PostMapping("/reset-password")
    @Transactional
    public ResponseEntity<?> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        
        // Check if the passwords match
        if (!request.getNewPassword().equals(request.getConfirmNewPassword())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Passwords do not match"));
        }

        // Then check the token
        PasswordResetToken resetToken = tokenRepository.findByToken(request.getToken()).orElse(null);

        if (resetToken == null) {
            return ResponseEntity.badRequest().body(Map.of("message","Invalid reset token."));
        }

        if (resetToken.getExpiryDate().isBefore(LocalDateTime.now())) {
            tokenRepository.delete(resetToken);
            return ResponseEntity.badRequest().body(Map.of("message","Reset token has expired. Please request a new one."));
        }

        User user = resetToken.getUser();
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        tokenRepository.delete(resetToken);

        return ResponseEntity.ok(Map.of("message", "Password successfully reset. You can now log in."));
    }
}