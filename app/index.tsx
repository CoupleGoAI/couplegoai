import React from 'react';
import App from '../App';

// This route exists so Expo's static web export can discover at least one route
// while the app itself continues to use the existing React Navigation setup.
export default function WebEntry(): React.ReactElement {
  return <App />;
}
