package com.autoqa.service;

import jakarta.annotation.PostConstruct;
import org.openqa.selenium.OutputType;
import org.openqa.selenium.TakesScreenshot;
import org.openqa.selenium.WebDriver;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
public class ScreenshotService {

    @Value("${screenshot.storage.path}")
    private String storagePath;

    @PostConstruct
    public void init() {
        try {
            Files.createDirectories(Paths.get(storagePath));
        } catch (IOException e) {
            throw new RuntimeException("Could not create screenshot storage directory!");
        }
    }

    public String takeAndSaveScreenshot(WebDriver driver, String siteName) throws IOException {
        File tempScreenshot = ((TakesScreenshot) driver).getScreenshotAs(OutputType.FILE);

        // Generate a unique, timestamped filename (e.g. Google_20260617_143026.png)
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
        String fileName = siteName.replaceAll("\\s+", "_") + "_" + timestamp + ".png";

        Path destination = Paths.get(storagePath, fileName);

        Files.copy(tempScreenshot.toPath(), destination, StandardCopyOption.REPLACE_EXISTING);

        return destination.toString();
    }
}