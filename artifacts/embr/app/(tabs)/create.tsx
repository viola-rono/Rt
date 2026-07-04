import { useEffect } from 'react';
import { router } from 'expo-router';

// This tab immediately redirects to the create-post flow.
// The actual "create" button in CustomTabBar handles navigation directly.
export default function CreateTab() {
  useEffect(() => {
    router.replace('/create-post/');
  }, []);
  return null;
}
