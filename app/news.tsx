import { useRouter } from "expo-router";
import { View } from "react-native";
import Header from "./components/header";
import NewsScreen from "./screens/News";

export default function NewsRoute() {
  const router = useRouter();

  return (
    <View style={{ flex: 1, backgroundColor: "#f8f2e8" }}>
      <Header onHome={() => {}} onNewChat={() => router.push("/")} />
      <NewsScreen />
    </View>
  );
}
