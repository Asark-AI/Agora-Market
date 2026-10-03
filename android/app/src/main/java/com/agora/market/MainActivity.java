package com.agora.market;

import android.content.Context;
import android.net.ConnectivityManager;
import android.net.Network;
import android.net.NetworkCapabilities;
import android.net.NetworkInfo;
import android.os.Build;
import android.os.Bundle;
import android.webkit.CookieManager;
import android.webkit.WebSettings;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
	private boolean isNetworkAvailable() {
		ConnectivityManager connectivityManager = (ConnectivityManager) getSystemService(Context.CONNECTIVITY_SERVICE);
		if (connectivityManager == null) {
			return true;
		}

		if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
			Network network = connectivityManager.getActiveNetwork();
			if (network == null) {
				return false;
			}
			NetworkCapabilities capabilities = connectivityManager.getNetworkCapabilities(network);
			return capabilities != null &&
				(capabilities.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) ||
					capabilities.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR) ||
					capabilities.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET) ||
					capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET));
		}

		NetworkInfo networkInfo = connectivityManager.getActiveNetworkInfo();
		return networkInfo != null && networkInfo.isConnected();
	}

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
				if (request != null && request.isForMainFrame() && !isNetworkAvailable()) {
					view.loadUrl("file:///android_asset/public/offline.html");
				}
			}

			@Override
			public void onReceivedHttpError(WebView view, WebResourceRequest request, WebResourceResponse errorResponse) {
				if (request != null && request.isForMainFrame() && errorResponse != null && errorResponse.getStatusCode() >= 500 && !isNetworkAvailable()) {
					view.loadUrl("file:///android_asset/public/offline.html");
				}
			}
		});
	}
}
