package com.autoqa.service;

import com.autoqa.entity.MonitoredSite;
import com.autoqa.entity.QaLog;
import com.autoqa.repository.MonitoredSiteRepository;
import com.autoqa.repository.QaLogRepository;
import com.github.romankh3.image.comparison.ImageComparison;
import com.github.romankh3.image.comparison.model.ImageComparisonResult;
import com.github.romankh3.image.comparison.model.ImageComparisonState;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.File;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
public class QaExecutionService {

    private final ScreenshotService screenshotService;
    private final QaLogRepository qaLogRepository;
    private final MonitoredSiteRepository siteRepository;

    public QaExecutionService(ScreenshotService screenshotService, QaLogRepository qaLogRepository, MonitoredSiteRepository siteRepository) {
        this.screenshotService = screenshotService;
        this.qaLogRepository = qaLogRepository;
        this.siteRepository = siteRepository;
    }

    public void runVisualTest(MonitoredSite site) {
        ChromeOptions options = new ChromeOptions();
        options.addArguments("--headless=new");
        options.addArguments("--window-size=1920,1080");

        WebDriver driver = new ChromeDriver(options);

        try {
            long startTime = System.currentTimeMillis();
            driver.get(site.getUrl());
            driver.manage().timeouts().implicitlyWait(Duration.ofSeconds(5));
            long endTime = System.currentTimeMillis();

            // Take the screenshot
            String currentImagePath = screenshotService.takeAndSaveScreenshot(driver, site.getName() + "_ACTUAL");
            
            QaLog log = new QaLog();
            log.setMonitoredSite(site);
            log.setActualLoadTimeMs((int) (endTime - startTime));

            // Do we have a baseline?
            if (site.getbaselineScreenshotPath() == null) {
                site.setbaselineScreenshotPath(currentImagePath);
                siteRepository.save(site);

                log.setStatus("BASELINE_CREATED");
                log.setScreenshotPath(currentImagePath);
                log.setVisualDifferenceScore(0.0);
                System.out.println("First run! Baseline established for: " + site.getName());
            } else {
                // Compare actual against the baseline
                BufferedImage expected = ImageIO.read(new File(site.getbaselineScreenshotPath()));
                BufferedImage actual = ImageIO.read(new File(currentImagePath));

                ImageComparison comparison = new ImageComparison(expected, actual);
                ImageComparisonResult result = comparison.compareImages();

                log.setVisualDifferenceScore(Double.parseDouble(String.valueOf(result.getDifferencePercent())));

                if (result.getImageComparisonState() == ImageComparisonState.MATCH) {
                    log.setStatus("PASS");
                    log.setScreenshotPath(currentImagePath); 
                    System.out.println("Test PASSED for: " + site.getName() + " (0% difference)");
                } else {
                    log.setStatus("FAIL");
                    
                    String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
                    String diffPath = "C:/qa_screenshots/" + site.getName() + "_DIFF_" + timestamp + ".png";
                    
                    File diffFile = new File(diffPath);
                    ImageIO.write(result.getResult(), "png", diffFile);
                    
                    log.setScreenshotPath(diffPath); 
                    System.out.println("Test FAILED for: " + site.getName() + " (" + result.getDifferencePercent() + "% difference)");
                }
            }

            qaLogRepository.save(log);

        } catch (Exception e) {
            System.err.println("Test completely failed for " + site.getName() + ": " + e.getMessage());
        } finally {
            driver.quit();
        }
    }
}