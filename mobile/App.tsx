import { Ionicons } from "@expo/vector-icons";
import { DarkTheme, NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider, useAuth } from "./src/auth";
import { CartProvider, useCart } from "./src/cart";
import AccountScreen from "./src/screens/AccountScreen";
import CartScreen from "./src/screens/CartScreen";
import HomeScreen from "./src/screens/HomeScreen";
import LoginScreen from "./src/screens/LoginScreen";
import MenuScreen from "./src/screens/MenuScreen";
import ProductScreen from "./src/screens/ProductScreen";
import QuizScreen from "./src/screens/QuizScreen";
import { C } from "./src/theme";

/** If anything throws while the app is running, show the message instead of a blank screen. */
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, padding: 24, paddingTop: 80 }}>
        <Text style={{ color: C.text, fontSize: 22, fontWeight: "800" }}>Something went wrong</Text>
        <Text style={{ color: C.muted, marginTop: 8 }}>Take a screenshot of this screen and send it to your developer.</Text>
        <ScrollView style={{ marginTop: 16 }}><Text style={{ color: "#FF8E83", fontSize: 13 }} selectable>{String(this.state.error?.stack ?? this.state.error?.message ?? this.state.error)}</Text></ScrollView>
      </View>
    );
  }
}

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
const theme = { ...DarkTheme, colors: { ...DarkTheme.colors, background: C.bg, card: C.surface, border: C.line, primary: C.yellow, text: C.text } };

const icon = (name: keyof typeof Ionicons.glyphMap) => ({ color, size }: { color: string; size: number }) => <Ionicons name={name} color={color} size={size} />;

function Tabs() {
  const { count } = useCart();
  return (
    <Tab.Navigator screenOptions={{ headerShown: false, tabBarActiveTintColor: C.yellow, tabBarInactiveTintColor: C.muted, tabBarStyle: { backgroundColor: C.surface, borderTopColor: C.line } }}>
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarIcon: icon("home-outline") }} />
      <Tab.Screen name="Menu" component={MenuScreen} options={{ tabBarIcon: icon("restaurant-outline") }} />
      <Tab.Screen name="Plan finder" component={QuizScreen} options={{ tabBarIcon: icon("compass-outline") }} />
      <Tab.Screen name="Cart" component={CartScreen} options={{ tabBarBadge: count > 0 ? count : undefined, tabBarBadgeStyle: { backgroundColor: C.red, color: "#fff" }, tabBarIcon: icon("bag-outline") }} />
      <Tab.Screen name="Account" component={AccountScreen} options={{ tabBarIcon: icon("person-outline") }} />
    </Tab.Navigator>
  );
}

function Signed() {
  return (
    <CartProvider>
      <Stack.Navigator>
        <Stack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />
        <Stack.Screen name="Product" component={ProductScreen} options={({ route }: any) => ({ title: route.params?.title ?? "Details", headerStyle: { backgroundColor: C.surface }, headerTintColor: C.text, headerBackButtonDisplayMode: "minimal", contentStyle: { backgroundColor: C.bg } })} />
      </Stack.Navigator>
    </CartProvider>
  );
}

function Root() {
  const { user, ready } = useAuth();
  if (!ready) return <View style={{ flex: 1, backgroundColor: C.bg, alignItems: "center", justifyContent: "center" }}><ActivityIndicator color={C.yellow} /></View>;
  return user ? <Signed /> : <LoginScreen />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <AuthProvider>
          <NavigationContainer theme={theme}>
            <StatusBar style="light" />
            <Root />
          </NavigationContainer>
        </AuthProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
