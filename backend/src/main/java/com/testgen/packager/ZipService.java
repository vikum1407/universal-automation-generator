package com.testgen.packager;

import org.springframework.stereotype.Service;
import java.io.*;
import java.nio.file.*;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

@Service
public class ZipService {

    public byte[] createZip(String fileName, String fileContent) {

        try {
            Path tempDir = Files.createTempDirectory("generated-framework");
            Path filePath = tempDir.resolve(fileName);

            // Write file
            Files.writeString(filePath, fileContent);

            // Create ZIP
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            ZipOutputStream zos = new ZipOutputStream(baos);

            ZipEntry entry = new ZipEntry(fileName);
            zos.putNextEntry(entry);
            zos.write(fileContent.getBytes());
            zos.closeEntry();
            zos.close();

            // Cleanup
            Files.deleteIfExists(filePath);
            Files.deleteIfExists(tempDir);

            return baos.toByteArray();

        } catch (Exception e) {
            throw new RuntimeException("Error creating ZIP file", e);
        }
    }
}
