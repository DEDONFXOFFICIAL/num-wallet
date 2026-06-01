import { Redirect } from 'expo-router';

export default function Index() {
  // TODO: check if user is already logged in → redirect to (tabs)/home
  // For now always go to onboarding
  return <Redirect href="/(auth)/splash" />;
}
