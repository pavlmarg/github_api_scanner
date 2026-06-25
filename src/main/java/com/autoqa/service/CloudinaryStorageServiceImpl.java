package com.autoqa.service;

import org.springframework.scheduling.annotation.Async; 
import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.autoqa.repository.StorageService;

import java.io.File;
import java.io.IOException;
import java.util.Map;

@Service
public class CloudinaryStorageServiceImpl implements StorageService {

    private static final Logger log = LoggerFactory.getLogger(CloudinaryStorageServiceImpl.class);

    private final Cloudinary cloudinary;

    public CloudinaryStorageServiceImpl(
            @Value("${cloudinary.cloud-name}") String cloudName,
            @Value("${cloudinary.api-key}") String apiKey,
            @Value("${cloudinary.api-secret}") String apiSecret) {
        
        this.cloudinary = new Cloudinary(ObjectUtils.asMap(
                "cloud_name", cloudName,
                "api_key", apiKey,
                "api_secret", apiSecret,
                "secure", true));
    }

    @Override
    public String uploadScreenshot(File file) throws IOException {
        Map<?, ?> uploadResult = cloudinary.uploader().upload(file, ObjectUtils.asMap(
                "folder", "autoqa_screenshots" 
        ));
        
        // Extract and return the permanent, secure https:// URL
        return uploadResult.get("secure_url").toString();
    }


    @Override
    @Async("qaTaskExecutor")
    public void deleteScreenshot(String fileUrl) {
        if (fileUrl == null || fileUrl.isEmpty()) return;
        
        try {
            String[] urlParts = fileUrl.split("/");
            String filename = urlParts[urlParts.length - 1];
            String publicId = "autoqa_screenshots/" + filename.substring(0, filename.lastIndexOf('.'));
            
            cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
            log.debug("Async Worker successfully deleted orphaned cloud image.");
        } catch (Exception e) {
            log.error("Failed to delete orphaned image from cloud: " + fileUrl);
        }
    }
}