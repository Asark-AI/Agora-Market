package com.agora.market;

import android.os.Bundle;
import android.webkit.CookieManager;
import android.webkit.WebSettings;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebResourceResponse;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
	@Override
	public void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);

		WebSettings settings = getBridge().getWebView().getSettings();
		settings.setDomStorageEnabled(true);
		settings.setDatabaseEnabled(true);
		settings.setJavaScriptEnabled(true);

		CookieManager cookieManager = CookieManager.getInstance();
		cookieManager.setAcceptCookie(true);
		cookieManager.setAcceptThirdPartyCookies(getBridge().getWebView(), true);

		getBridge().getWebView().setWebViewClient(new WebViewClient() {
			@Override
			public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
				if (request.isForMainFrame()) {
					view.loadUrl("file:///android_asset/public/offline.html");
				}
			}

			@Override
			public void onReceivedHttpError(WebView view, WebResourceRequest request, WebResourceResponse errorResponse) {
				if (request.isForMainFrame() && errorResponse.getStatusCode() >= 500) {
					view.loadUrl("file:///android_asset/public/offline.html");
				}
			}
		});
	}
}
