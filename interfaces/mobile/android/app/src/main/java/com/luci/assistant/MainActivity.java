package com.luci.assistant;

import android.content.Context;
import android.os.Bundle;
import android.os.PowerManager;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import com.getcapacitor.BridgeActivity;

import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class MainActivity extends BridgeActivity {
    private PowerManager.WakeLock wakeLock;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        try {
            PowerManager powerManager = (PowerManager) getSystemService(Context.POWER_SERVICE);
            if (powerManager != null) {
                wakeLock = powerManager.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "LuciAssistant:AudioPlaybackLock");
                wakeLock.acquire(10 * 60 * 1000L /* 10 minutes */);
            }
        } catch (Exception ignored) {}
    }

    @Override
    public void onStart() {
        super.onStart();
        if (getBridge() != null && getBridge().getWebView() != null) {
            WebView webView = getBridge().getWebView();
            WebSettings settings = webView.getSettings();
            settings.setJavaScriptEnabled(true);
            settings.setDomStorageEnabled(true);
            settings.setDatabaseEnabled(true);
            settings.setAllowFileAccess(true);
            settings.setAllowContentAccess(true);
            settings.setMediaPlaybackRequiresUserGesture(false);
            settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
            settings.setUserAgentString(settings.getUserAgentString() + " LuciApp/1.0");

            // Injeta o header ngrok-skip-browser-warning em TODAS as requisições HTTP
            // para evitar a tela de aviso do Ngrok ("Visit Site") no WebView
            webView.setWebViewClient(new WebViewClient() {
                @Override
                public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                    String url = request.getUrl().toString();
                    // Apenas intercepta requisições para o Ngrok
                    if (url.contains("ngrok-free.dev") || url.contains("ngrok.io")) {
                        try {
                            HttpURLConnection conn = (HttpURLConnection) new URL(url).openConnection();
                            conn.setRequestMethod(request.getMethod());
                            // Copia headers originais
                            Map<String, String> headers = request.getRequestHeaders();
                            if (headers != null) {
                                for (Map.Entry<String, String> entry : headers.entrySet()) {
                                    conn.setRequestProperty(entry.getKey(), entry.getValue());
                                }
                            }
                            // Injeta o header mágico do Ngrok
                            conn.setRequestProperty("ngrok-skip-browser-warning", "1");
                            conn.setRequestProperty("User-Agent", "LuciApp/1.0");
                            conn.setConnectTimeout(10000);
                            conn.setReadTimeout(30000);

                            int statusCode = conn.getResponseCode();
                            String contentType = conn.getContentType();
                            String encoding = "UTF-8";
                            String mimeType = "text/html";

                            if (contentType != null) {
                                String[] parts = contentType.split(";");
                                mimeType = parts[0].trim();
                                for (String part : parts) {
                                    String trimmed = part.trim();
                                    if (trimmed.startsWith("charset=")) {
                                        encoding = trimmed.substring(8).trim();
                                    }
                                }
                            }

                            InputStream inputStream;
                            if (statusCode >= 400) {
                                inputStream = conn.getErrorStream();
                            } else {
                                inputStream = conn.getInputStream();
                            }

                            // Mapeia response headers
                            Map<String, String> responseHeaders = new HashMap<>();
                            Map<String, List<String>> headerFields = conn.getHeaderFields();
                            if (headerFields != null) {
                                for (Map.Entry<String, List<String>> entry : headerFields.entrySet()) {
                                    if (entry.getKey() != null && entry.getValue() != null && !entry.getValue().isEmpty()) {
                                        responseHeaders.put(entry.getKey(), entry.getValue().get(0));
                                    }
                                }
                            }

                            return new WebResourceResponse(
                                mimeType,
                                encoding,
                                statusCode,
                                conn.getResponseMessage() != null ? conn.getResponseMessage() : "OK",
                                responseHeaders,
                                inputStream
                            );
                        } catch (IOException e) {
                            // Falha na interceptação — deixa o WebView resolver naturalmente
                            return super.shouldInterceptRequest(view, request);
                        }
                    }
                    return super.shouldInterceptRequest(view, request);
                }
            });
        }
    }

    @Override
    public void onPause() {
        super.onPause();
        if (getBridge() != null && getBridge().getWebView() != null) {
            getBridge().getWebView().resumeTimers();
        }
    }

    @Override
    public void onStop() {
        super.onStop();
        if (getBridge() != null && getBridge().getWebView() != null) {
            getBridge().getWebView().resumeTimers();
        }
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        if (wakeLock != null && wakeLock.isHeld()) {
            try {
                wakeLock.release();
            } catch (Exception ignored) {}
        }
    }
}
