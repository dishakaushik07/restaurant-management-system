package com.Ramyaiosnexus.knos;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onStart() {
        super.onStart();
        getBridge().getWebView().getSettings().setMediaPlaybackRequiresUserGesture(false);
    }
}

