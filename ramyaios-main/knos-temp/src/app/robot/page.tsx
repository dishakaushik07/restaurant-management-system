import { RobotDashboard } from './RobotDashboard';
import Script from 'next/script';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Robot Control - Kalvix Serve',
};

export default function RobotPage() {
  return (
    <>
      {/* Load OpenCV.js for camera marker detection */}
      <Script src="/opencv.js" strategy="lazyOnload" />
      <div className="h-screen w-full">
        <RobotDashboard />
      </div>
    </>
  );
}
