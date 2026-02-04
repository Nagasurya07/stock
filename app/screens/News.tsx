import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type NewsItem = {
  id: string;
  title: string;
  link: string;
  publishedAt: string | null;
  publisher: string;
  summary: string;
  thumbnail?: string | null;
};

const getApiUrl = () =>
  Platform.OS === "web"
    ? "http://127.0.0.1:3000/api/news"
    : Platform.OS === "android"
      ? "http://10.0.2.2:3000/api/news"
      : "http://localhost:3000/api/news";

export default function NewsScreen() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [alertsEnabled, setAlertsEnabled] = useState(false);
  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [pendingAlertsState, setPendingAlertsState] = useState(false);

  const apiUrl = useMemo(() => getApiUrl(), []);

  useEffect(() => {
    let isMounted = true;

    const loadNews = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`${apiUrl}?region=IN&limit=25`);
        const data = await response.json();

        if (!response.ok || !data?.success) {
          throw new Error("Failed to fetch news");
        }

        if (isMounted) {
          setNews(Array.isArray(data.news) ? data.news : []);
        }
      } catch (err) {
        if (isMounted) {
          setError("Unable to load news. Please try again.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadNews();

    return () => {
      isMounted = false;
    };
  }, [apiUrl]);

  const handleAlertToggle = () => {
    const nextState = !alertsEnabled;
    setPendingAlertsState(nextState);
    setAlertModalOpen(true);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>News & Community</Text>
          <Text style={styles.subtitle}>Daily market headlines from Yahoo</Text>
        </View>
        <TouchableOpacity
          style={[
            styles.alertToggle,
            alertsEnabled && styles.alertToggleActive,
          ]}
          onPress={handleAlertToggle}
          activeOpacity={0.8}
        >
          <View
            style={[styles.alertDot, alertsEnabled && styles.alertDotActive]}
          />
          <Text
            style={[
              styles.alertToggleText,
              alertsEnabled && styles.alertToggleTextActive,
            ]}
          >
            Alerts {alertsEnabled ? "On" : "Off"}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Market Pulse</Text>
        <Text style={styles.heroSubtitle}>
          Stay on top of earnings, macro moves, and community chatter.
        </Text>
      </View>

      <Modal
        visible={alertModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setAlertModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Email Alerts</Text>
            <Text style={styles.modalMessage}>
              {pendingAlertsState
                ? "Do you want to receive notifications through email?"
                : "Turn off email notifications?"}
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonGhost]}
                onPress={() => setAlertModalOpen(false)}
              >
                <Text style={styles.modalButtonGhostText}>No</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={() => {
                  setAlertsEnabled(pendingAlertsState);
                  setAlertModalOpen(false);
                }}
              >
                <Text style={styles.modalButtonPrimaryText}>Yes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {loading && (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#FF6B6B" />
          <Text style={styles.loadingText}>Loading latest news...</Text>
        </View>
      )}

      {!loading && error && (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {!loading && !error && news.length === 0 && (
        <View style={styles.centered}>
          <Text style={styles.emptyTitle}>No news yet</Text>
          <Text style={styles.emptyText}>
            Check back soon for the latest headlines.
          </Text>
        </View>
      )}

      {!loading && !error && news.length > 0 && (
        <ScrollView contentContainerStyle={styles.list}>
          {news.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.card}
              onPress={() => item.link && Linking.openURL(item.link)}
              activeOpacity={0.8}
            >
              <Text style={styles.cardTitle}>{item.title}</Text>
              {!!item.summary && (
                <Text style={styles.cardSummary} numberOfLines={3}>
                  {item.summary}
                </Text>
              )}
              <View style={styles.cardFooter}>
                <View style={styles.publisherBadge}>
                  <Text style={styles.publisherText}>
                    {item.publisher || "Yahoo"}
                  </Text>
                </View>
                <Text style={styles.cardMeta}>
                  {item.publishedAt
                    ? new Date(item.publishedAt).toLocaleString()
                    : ""}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f2e8",
    paddingHorizontal: 16,
    paddingTop: 27,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#000000",
  },
  subtitle: {
    marginTop: 6,
    fontSize: 13,
    color: "#6d6875",
  },
  alertToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "#0f172a",
    shadowColor: "#0f172a",
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  alertToggleActive: {
    backgroundColor: "#111827",
    borderColor: "#fbbf24",
  },
  alertDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: "#e2e8f0",
  },
  alertDotActive: {
    backgroundColor: "#fbbf24",
    shadowColor: "#fbbf24",
    shadowOpacity: 0.9,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
  alertToggleText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#e2e8f0",
    letterSpacing: 0.3,
  },
  alertToggleTextActive: {
    color: "#ffffff",
  },
  hero: {
    backgroundColor: "#fff5d6",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#f5e4a6",
  },
  heroTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2b2b2b",
  },
  heroSubtitle: {
    marginTop: 6,
    fontSize: 12,
    color: "#6d6875",
    lineHeight: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  modalCard: {
    width: "100%",
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    borderColor: "#eef2ff",
    shadowColor: "#0f172a",
    shadowOpacity: 0.18,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  modalTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: "#0f172a",
    letterSpacing: 0.2,
  },
  modalMessage: {
    marginTop: 10,
    fontSize: 13,
    color: "#64748b",
    lineHeight: 19,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 18,
  },
  modalButton: {
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 12,
  },
  modalButtonGhost: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  modalButtonPrimary: {
    backgroundColor: "#111827",
  },
  modalButtonGhostText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0f172a",
  },
  modalButtonPrimaryText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#ffffff",
  },
  centered: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
  },
  loadingText: {
    marginTop: 12,
    color: "#666",
  },
  errorText: {
    color: "#c1121f",
    fontWeight: "600",
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000000",
  },
  emptyText: {
    marginTop: 6,
    color: "#6d6875",
    textAlign: "center",
  },
  list: {
    paddingBottom: 20,
    gap: 12,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e8e8e8",
    shadowColor: "#000000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 8,
  },
  cardSummary: {
    fontSize: 13,
    color: "#555",
    marginBottom: 12,
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardMeta: {
    fontSize: 12,
    color: "#8e92a9",
  },
  publisherBadge: {
    backgroundColor: "#eef2ff",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  publisherText: {
    fontSize: 11,
    color: "#4c6ef5",
    fontWeight: "600",
  },
});
