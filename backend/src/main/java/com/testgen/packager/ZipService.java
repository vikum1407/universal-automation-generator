package com.testgen.packager;

import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Map;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

@Service
public class ZipService {

    public byte[] createZip(Map<String, String> files) throws IOException {

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ZipOutputStream zos = new ZipOutputStream(baos);

        for (Map.Entry<String, String> entry : files.entrySet()) {
            String filePath = entry.getKey();
            String content = entry.getValue();

            ZipEntry zipEntry = new ZipEntry(filePath);
            zos.putNextEntry(zipEntry);
            zos.write(content.getBytes());
            zos.closeEntry();
        }

        zos.close();
        return baos.toByteArray();
    }
}
