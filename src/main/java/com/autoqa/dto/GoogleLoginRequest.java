package com.autoqa.dto;

import jakarta.validation.constraints.NotBlank;

public class GoogleLoginRequest {
    
    @NotBlank(message = "Google token is required")
    private String tokenId;

    public String getTokenId() { return tokenId; }
    public void setTokenId(String tokenId) { this.tokenId = tokenId; }
}