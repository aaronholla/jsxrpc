import { Suspense } from "react";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";
import { useRpcComponents } from "jsxrpc/client";

export default function App() {
  const { ServerComponent } = useRpcComponents("http://localhost:5173");

  return (
    <View style={styles.container}>
      <Suspense
        fallback={<Text>Fallback while rendering server component...</Text>}
      >
        <ServerComponent />
      </Suspense>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
