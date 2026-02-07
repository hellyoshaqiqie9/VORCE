import React from 'react';
import Image from 'next/image';

const LoadingScreen = () => {
  return (
    <div className="vorce-loading-screen">
      <div className="vorce-loader-3d">
        <div className="logo-face front">
          <Image 
            src="/vorce-logo.svg" 
            alt="Vorce Logo" 
            width={48} 
            height={48} 
            priority
          />
        </div>
        <div className="logo-face back">
           <Image 
            src="/vorce-logo.svg" 
            alt="Vorce Logo" 
            width={48} 
            height={48} 
            priority
          />
        </div>
        <div className="logo-shadow"></div>
      </div>
      <div className="loading-text">
        <span>V</span>
        <span>O</span>
        <span>R</span>
        <span>C</span>
        <span>E</span>
      </div>
    </div>
  );
};

export default LoadingScreen;
