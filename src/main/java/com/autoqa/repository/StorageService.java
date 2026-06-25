package com.autoqa.repository;

import java.io.File;
import java.io.IOException;

public interface StorageService {
    String uploadScreenshot(File file) throws IOException;

    void deleteScreenshot(String fileUrl);
}