package com.autoqa.service;

import com.autoqa.entity.MonitoredSite;
import com.autoqa.entity.QaLog;
import com.autoqa.repository.MonitoredSiteRepository;
import com.autoqa.repository.QaLogRepository;
import com.autoqa.repository.StorageService; 
import com.github.romankh3.image.comparison.ImageComparison;
import com.github.romankh3.image.comparison.model.ImageComparisonResult;
import com.github.romankh3.image.comparison.model.ImageComparisonState;
import org.openqa.selenium.OutputType;
import org.openqa.selenium.TakesScreenshot;
import org.openqa.selenium.TimeoutException;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.File;
import java.net.URL;
import java.time.Duration;
import java.time.LocalDateTime;

@Service
public class QaExecutionService {

    private static final Logger logg = LoggerFactory.getLogger(QaExecutionService.class);

    private final StorageService storageService; 
    private final QaLogRepository qaLogRepository;
    private final MonitoredSiteRepository siteRepository;

    public QaExecutionService(StorageService storageService, QaLogRepository qaLogRepository, MonitoredSiteRepository siteRepository) {
        this.storageService = storageService;
        this.qaLogRepository = qaLogRepository;
        this.siteRepository = siteRepository;
    }

    public void runVisualTest(MonitoredSite site) {
        ChromeOptions options = new ChromeOptions();
        options.addArguments("--headless=new");
        options.addArguments("--window-size=1920,1080");

        // Declare the driver outside so the 'finally' block can see it...
        WebDriver driver = null; 

        try {
            driver = new ChromeDriver(options);

            // 20-Second Kill Switches
            driver.manage().timeouts().pageLoadTimeout(Duration.ofSeconds(20));
            driver.manage().timeouts().scriptTimeout(Duration.ofSeconds(15));
            driver.manage().timeouts().implicitlyWait(Duration.ofSeconds(5));

            long startTime = System.currentTimeMillis();
            driver.get(site.getUrl());
            long endTime = System.currentTimeMillis();

            // Selenium takes the screenshot and saves it to a temporary hidden file
            File tempScreenshot = ((TakesScreenshot) driver).getScreenshotAs(OutputType.FILE);
            
            // Immediately upload that temporary file to Cloudinary
            String actualImageUrl = storageService.uploadScreenshot(tempScreenshot);

            QaLog log = new QaLog();
            log.setMonitoredSite(site);
            log.setActualLoadTimeMs((int) (endTime - startTime));

            // Do we have a baseline?
            if (site.getbaselineScreenshotPath() == null) {
                site.setbaselineScreenshotPath(actualImageUrl);
                siteRepository.save(site);

                log.setStatus("BASELINE_CREATED");
                log.setScreenshotPath(actualImageUrl);
                log.setVisualDifferenceScore(0.0);
                logg.info("First run! Baseline established for: {}", site.getName());
            } else {
                // Read the expected baseline image directly from the Cloudinary URL
                BufferedImage expected = ImageIO.read(new URL(site.getbaselineScreenshotPath()));
                BufferedImage actual = ImageIO.read(tempScreenshot);

                ImageComparison comparison = new ImageComparison(expected, actual);
                ImageComparisonResult result = comparison.compareImages();

                log.setVisualDifferenceScore(result.getDifferencePercent());

                if (result.getImageComparisonState() == ImageComparisonState.MATCH) {
                    log.setStatus("PASS");
                    log.setScreenshotPath(actualImageUrl); 
                    logg.info("Test PASSED for: {} (0% difference)", site.getName());
                } else {
                    log.setStatus("FAIL");
                    
                    // Create a temporary file for the diff image
                    File tempDiff = File.createTempFile(site.getName() + "_DIFF", ".png");
                    ImageIO.write(result.getResult(), "png", tempDiff);
                    
                    String diffImageUrl = storageService.uploadScreenshot(tempDiff);
                    tempDiff.delete(); 
                    
                    log.setScreenshotPath(diffImageUrl); 
                    logg.info("Test FAILED for: {} ({}% difference)", site.getName(), result.getDifferencePercent());
                }
            }

            // Delete the initial temp screenshot file to prevent disk-space leaks
            if (tempScreenshot.exists()) {
                tempScreenshot.delete();
            }

            log.setExecutedAt(LocalDateTime.now());
            qaLogRepository.save(log);

        } catch (TimeoutException e) {
            // Catch hanging websites specifically
            logg.error("Selenium timed out waiting for site (exceeded 20s): {}", site.getName());
            createFailedLog(site, "TIMEOUT - Site took longer than 20s to load");
            
        } catch (Exception e) {
            logg.error("Test completely failed for {}: {}", site.getName(), e.getMessage(), e);
            createFailedLog(site, "ERROR - " + e.getMessage());
        } finally {
            if (driver != null) {
                try {
                    driver.quit();
                } catch (Exception e) {
                    logg.error("Failed to close WebDriver for site: {}", site.getName(), e);
                }
            }

            site.setIsTesting(false);
            siteRepository.save(site);
            logg.info("Released idempotency lock for site: {}", site.getName());
        }
    }

    // Helper method to guarantee the UI shows why a test broke
    private void createFailedLog(MonitoredSite site, String reason) {
        QaLog log = new QaLog();
        log.setMonitoredSite(site);
        log.setStatus("FAIL");
        log.setExecutedAt(LocalDateTime.now());
        log.setActualLoadTimeMs(20000); // Maxed out based on 20s limit
        log.setVisualDifferenceScore(100.0);
        qaLogRepository.save(log);
    }

    @Async("qaTaskExecutor")
    public void runScheduledVisualTest(MonitoredSite site) {
        // Makes sure the method runs on a background thread
        logg.info("{} picking up scheduled test for: {}", Thread.currentThread().getName(), site.getName());
        runVisualTest(site); 
    }
}