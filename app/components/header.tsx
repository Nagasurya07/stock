import { PressStart2P_400Regular } from "@expo-google-fonts/press-start-2p";
import {
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";
import { useFonts } from "expo-font";
import { useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../contexts/AuthContext";
import ProfileCard from "./ProfileCard";

type HeaderProps = {
  onNewChat?: () => void;
  onHome?: () => void;
};

export default function Header({ onNewChat, onHome }: HeaderProps) {
  const [fontsLoaded] = useFonts({ PressStart2P_400Regular });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [profileCardOpen, setProfileCardOpen] = useState(false);
  const { signOut, user } = useAuth();

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await signOut();
          setDrawerOpen(false);
        },
      },
    ]);
  };

  const historyData = [
    {
      id: 1,
      stock: "AAPL",
      price: "$192.53",
      time: "2 hours ago",
      change: "+2.4%",
    },
    {
      id: 2,
      stock: "NVDA",
      price: "$875.43",
      time: "5 hours ago",
      change: "+3.1%",
    },
    {
      id: 3,
      stock: "MSFT",
      price: "$378.91",
      time: "1 day ago",
      change: "+1.8%",
    },
    {
      id: 4,
      stock: "TSLA",
      price: "$245.60",
      time: "2 days ago",
      change: "-1.2%",
    },
    {
      id: 5,
      stock: "GOOGL",
      price: "$158.30",
      time: "3 days ago",
      change: "+0.9%",
    },
  ];

  return (
    <View
      style={{
        height: 114,
        backgroundColor: "#f8f2e8",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingTop: 44,
        paddingBottom: 14,
        position: "relative",
        borderBottomWidth: 1,
        borderBottomColor: "rgba(255,255,255,0.06)",
      }}
    >
      {/* Background Text */}
      <Text
        style={{
          fontSize: 38,
          fontWeight: "200",
          color: "#6d6875",
          fontFamily: fontsLoaded ? "PressStart2P_400Regular" : undefined,
          position: "absolute",
          left: 0,
          right: 0,
          top: 54,
          textAlign: "center",
          zIndex: 0,
        }}
      >
        SOCAI
      </Text>

      {/* Header Content */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: 4,
          zIndex: 1,
        }}
      >
        {/* Hamburger Menu (Three Lines) */}
        <TouchableOpacity
          onPress={() => setDrawerOpen(true)}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: "#ffffff",
            borderWidth: 1,
            borderColor: "rgba(0,0,0,0.08)",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <View
            style={{
              width: 24,
              height: 2.5,
              backgroundColor: "#87bfff",
              borderRadius: 1,
              marginBottom: 5,
            }}
          />
          <View
            style={{
              width: 24,
              height: 2.5,
              backgroundColor: "#87bfff",
              borderRadius: 1,
              marginBottom: 5,
            }}
          />
          <View
            style={{
              width: 24,
              height: 2.5,
              backgroundColor: "#ffd700",
              borderRadius: 1,
            }}
          />
        </TouchableOpacity>

        {/* Profile Logo */}
        <TouchableOpacity
          onPress={() => setProfileCardOpen(true)}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: "#007bff",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <MaterialIcons name="person" size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* Profile Card Modal */}
      <Modal
        visible={profileCardOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setProfileCardOpen(false)}
      >
        <ProfileCard onClose={() => setProfileCardOpen(false)} />
      </Modal>

      {/* Drawer Modal */}
      <Modal
        visible={drawerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setDrawerOpen(false)}
      >
        <View style={styles.modalOverlay}>
          {/* Drawer Container */}
          <View style={styles.drawer}>
            {/* Close Button */}
            <TouchableOpacity
              onPress={() => setDrawerOpen(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={28} color="#000000" />
            </TouchableOpacity>

            {/* Menu Items */}
            <View style={styles.menuContainer}>
              {/* Home */}
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  onHome?.();
                  setDrawerOpen(false);
                }}
              >
                <MaterialIcons name="home" size={24} color="#87bfff" />
                <Text style={styles.menuItemText}>Home</Text>
              </TouchableOpacity>

              {/* New Chat */}
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  onNewChat?.();
                  setDrawerOpen(false);
                }}
              >
                <MaterialIcons name="add" size={24} color="#10a37f" />
                <Text style={styles.menuItemText}>New Chat</Text>
              </TouchableOpacity>

              {/* Logout */}
              

              {/* History Section */}
              <View>
                <TouchableOpacity style={styles.menuItem}>
                  <MaterialCommunityIcons
                    name="history"
                    size={24}
                    color="#c1121f"
                  />
                  <Text style={styles.menuItemText}>History</Text>
                </TouchableOpacity>

                {/* Separator Line */}
                <View style={styles.separatorLine} />

                {/* History Demo Data */}
                <ScrollView style={styles.historyList}>
                  {historyData.map((item) => (
                    <View key={item.id} style={styles.historyItem}>
                      <View style={styles.historyContent}>
                        <Text style={styles.historyStock}>{item.stock}</Text>
                        <Text style={styles.historyTime}>{item.time}</Text>
                      </View>
                      <View style={styles.historyRight}>
                        <Text style={styles.historyPrice}>{item.price}</Text>
                        <Text
                          style={[
                            styles.historyChange,
                            {
                              color: item.change.startsWith("+")
                                ? "#10a37f"
                                : "#ff6b6b",
                            },
                          ]}
                        >
                          {item.change}
                        </Text>
                      </View>
                    </View>
                  ))}
                </ScrollView>
              </View>
            </View>
          </View>

          {/* Backdrop */}
          <TouchableOpacity
            style={styles.backdrop}
            onPress={() => setDrawerOpen(false)}
            activeOpacity={0}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  drawer: {
    width: "75%",
    backgroundColor: "#f8f2e8",
    paddingTop: 20,
    paddingHorizontal: 20,
    height: "100%",
  },
  closeButton: {
    alignSelf: "flex-end",
    marginBottom: 20,
    padding: 8,
  },
  menuContainer: {
    gap: 12,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 12,
    backgroundColor: "#f8f2e8",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#f8f2e8",
    gap: 12,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
  },
  separatorLine: {
    height: 1,
    backgroundColor: "#d0d0d0",
    marginVertical: 12,
    marginHorizontal: 12,
  },
  historyList: {
    maxHeight: 300,
    gap: 8,
  },
  historyItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: "#ffffff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e8e8e8",
    marginBottom: 8,
  },
  historyContent: {
    flex: 1,
  },
  historyStock: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 2,
  },
  historyTime: {
    fontSize: 12,
    color: "#8e92a9",
  },
  historyRight: {
    alignItems: "flex-end",
  },
  historyPrice: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 2,
  },
  historyChange: {
    fontSize: 12,
    fontWeight: "600",
  },
  backdrop: {
    flex: 1,
  },
});
