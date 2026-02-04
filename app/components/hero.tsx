import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type StockCard = {
  rank: number;
  symbol: string;
  company: string;
  price: string;
  change: string;
  percentChange: string;
  changeColor: string;
  percentChangeColor: string;
};

type HeroProps = {
  inputOnly?: boolean;
  onExitInputOnly?: () => void;
};

export default function Hero({
  inputOnly = false,
  onExitInputOnly,
}: HeroProps) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ role: string; content: string }[]>(
    [],
  );
  const [stockCards, setStockCards] = useState<StockCard[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (inputOnly) {
      setMessages([]);
      setStockCards([]);
    }
  }, [inputOnly]);

  const defaultResponse = {
    role: "assistant",
    content:
      "I've analyzed the uploaded data. Based on current market trends, I recommend focusing on tech stocks with strong earnings reports. AAPL and MSFT show promising momentum with positive technical indicators. Consider setting alerts at key resistance levels.",
  };

  const quickActions = [
    {
      icon: "trending-up",
      title: "Trending Stocks",
      subtitle: "Top gainers today",
      color: "#87bfff",
    },
    {
      icon: "alert-circle",
      title: "Stock Alerts",
      subtitle: "Your watchlist",
      color: "#ffd700",
    },
    {
      icon: "bar-chart",
      title: "Analysis",
      subtitle: "AI Insights",
      color: "#87bfff",
    },
    {
      icon: "target",
      title: "Screener",
      subtitle: "Find opportunities",
      color: "#ffd700",
    },
  ];

  const handleUpload = () => {
    setMessages([defaultResponse]);
  };

  const handleSend = async () => {
    if (input.trim()) {
      const userQuery = input;

      // Add user message
      setMessages((prev) => [
        ...prev,
        { role: "user", content: userQuery },
        { role: "assistant", content: "🤔 Processing your query..." },
      ]);
      setInput("");
      setIsProcessing(true);

      try {
        // Process query using queryreplicat
        // Use 127.0.0.1 instead of localhost for better web browser compatibility
        const apiUrl =
          Platform.OS === "web"
            ? "http://127.0.0.1:3000/api/query"
            : Platform.OS === "android"
              ? "http://10.0.2.2:3000/api/query"
              : "http://localhost:3000/api/query";

        console.log("📡 Sending request to:", apiUrl);
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ query: userQuery }),
        });

        console.log("📡 Response status:", response.status);

        if (!response.ok) {
          throw new Error("Failed to process query");
        }

        const data = await response.json();

        // Update messages with result
        setMessages((prev) => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = {
            role: "assistant",
            content: data.displayMessage || "✅ Query processed successfully!",
          };
          return newMessages;
        });

        // Update stock cards
        if (data.cards && data.cards.length > 0) {
          setStockCards(data.cards);
        } else {
          setStockCards([]);
        }

        if (inputOnly) {
          onExitInputOnly?.();
        }
      } catch (error) {
        console.error("Query processing error:", error);
        console.error("Error message:", error?.message);
        console.error("Error type:", error?.constructor?.name);
        setMessages((prev) => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = {
            role: "assistant",
            content:
              `❌ Network error: ${error?.message || "Failed to reach API server"}. ` +
              `Make sure the backend is running on http://127.0.0.1:3000`,
          };
          return newMessages;
        });
        setStockCards([]);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
    >
      {inputOnly ? (
        <View style={styles.inputOnlySpacer} />
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Show stock cards if available */}
          {stockCards.length > 0 ? (
            <View style={styles.resultsContainer}>
              {/* Messages */}
              {messages.length > 0 && (
                <View style={styles.messagesContainer}>
                  {messages.map((msg, index) => (
                    <View
                      key={index}
                      style={[
                        styles.messageBox,
                        msg.role === "user"
                          ? styles.userMessage
                          : styles.aiMessage,
                      ]}
                    >
                      <Text
                        style={[
                          styles.messageText,
                          msg.role === "user"
                            ? styles.userMessageText
                            : styles.aiMessageText,
                        ]}
                      >
                        {msg.content}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Stock Cards */}
              <View style={styles.stockCardsContainer}>
                {stockCards.map((stock, index) => (
                  <View
                    key={`${stock.symbol}-${index}`}
                    style={styles.stockCard}
                  >
                    {/* Header Row: Rank & Symbol */}
                    <View style={styles.headerRow}>
                      <View style={styles.rankBadge}>
                        <Text style={styles.rankText}>#{stock.rank}</Text>
                      </View>
                      <Text style={styles.symbolText}>{stock.symbol}</Text>
                    </View>

                    {/* Company Name */}
                    <Text style={styles.companyText} numberOfLines={2}>
                      {stock.company}
                    </Text>

                    {/* Divider */}
                    <View style={styles.cardDivider} />

                    {/* Stats Row */}
                    <View style={styles.statsRow}>
                      {/* Price */}
                      <View style={styles.statItem}>
                        <Text style={styles.statLabel}>Price</Text>
                        <Text style={styles.priceText}>{stock.price}</Text>
                      </View>

                      {/* Change */}
                      <View style={styles.statItem}>
                        <Text style={styles.statLabel}>Change</Text>
                        <View style={styles.changeContainer}>
                          <Feather
                            name={
                              stock.change.startsWith("+")
                                ? "trending-up"
                                : stock.change.startsWith("-")
                                  ? "trending-down"
                                  : "minus"
                            }
                            size={14}
                            color={stock.changeColor}
                          />
                          <Text
                            style={[
                              styles.changeText,
                              { color: stock.changeColor },
                            ]}
                          >
                            {stock.change}
                          </Text>
                        </View>
                      </View>

                      {/* Percent Change */}
                      <View style={styles.statItem}>
                        <Text style={styles.statLabel}>% Change</Text>
                        <View
                          style={[
                            styles.percentBadge,
                            {
                              backgroundColor: stock.percentChange.startsWith(
                                "+",
                              )
                                ? "#dcfce7"
                                : stock.percentChange.startsWith("-")
                                  ? "#fee2e2"
                                  : "#f3f4f6",
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.percentText,
                              { color: stock.percentChangeColor },
                            ]}
                          >
                            {stock.percentChange}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          ) : /* Show messages if any */
          messages.length > 0 ? (
            <View style={styles.messagesContainer}>
              {messages.map((msg, index) => (
                <View
                  key={index}
                  style={[
                    styles.messageBox,
                    msg.role === "user" ? styles.userMessage : styles.aiMessage,
                  ]}
                >
                  <Text
                    style={[
                      styles.messageText,
                      msg.role === "user"
                        ? styles.userMessageText
                        : styles.aiMessageText,
                    ]}
                  >
                    {msg.content}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <>
              {/* Welcome Section */}

              {/* Portfolio Summary Card */}

              {/* Quick Actions */}
              <View style={styles.actionsSection}>
                <Text style={styles.sectionTitle}>Quick Actions</Text>
                <View style={styles.actionGrid}>
                  {quickActions.map((action, index) => (
                    <TouchableOpacity key={index} style={styles.actionCard}>
                      <View
                        style={[
                          styles.actionIcon,
                          { backgroundColor: `${action.color}20` },
                        ]}
                      >
                        <MaterialCommunityIcons
                          name={action.icon as any}
                          size={28}
                          color={action.color}
                        />
                      </View>
                      <Text style={styles.actionTitle}>{action.title}</Text>
                      <Text style={styles.actionSubtitle}>
                        {action.subtitle}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Featured Stocks */}
              <View style={styles.featuredSection}>
                <Text style={styles.sectionTitle}>Top Performers</Text>
                <View style={styles.stocksList}>
                  {[
                    {
                      symbol: "AAPL",
                      name: "Apple",
                      price: "$192.53",
                      change: "+2.4%",
                    },
                    {
                      symbol: "NVDA",
                      name: "NVIDIA",
                      price: "$875.43",
                      change: "+3.1%",
                    },
                    {
                      symbol: "MSFT",
                      name: "Microsoft",
                      price: "$378.91",
                      change: "+1.8%",
                    },
                  ].map((stock, index) => (
                    <TouchableOpacity key={index} style={styles.stockItem}>
                      <View style={styles.stockInfo}>
                        <Text style={styles.stockSymbol}>{stock.symbol}</Text>
                        <Text style={styles.stockName}>{stock.name}</Text>
                      </View>
                      <View style={styles.stockRight}>
                        <Text style={styles.stockPrice}>{stock.price}</Text>
                        <Text
                          style={[styles.stockChange, { color: "#10a37f" }]}
                        >
                          {stock.change}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </>
          )}
        </ScrollView>
      )}

      {/* Search Bar at Bottom */}
      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <TouchableOpacity
            onPress={handleUpload}
            style={styles.uploadButton}
          ></TouchableOpacity>
          <TextInput
            style={styles.textInput}
            placeholder="Search stocks or ask AI..."
            placeholderTextColor="#8e92a9"
            value={input}
            onChangeText={setInput}
          />
          {input.length > 0 && (
            <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
              <Ionicons name="arrow-up" size={18} color="#ffffff" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f2e8",
    justifyContent: "space-between",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    paddingBottom: 120,
  },
  messagesContainer: {
    gap: 12,
    paddingBottom: 20,
  },
  messageBox: {
    padding: 14,
    borderRadius: 12,
    marginVertical: 6,
  },
  userMessage: {
    backgroundColor: "#87bfff",
    alignSelf: "flex-end",
    maxWidth: "80%",
    borderBottomRightRadius: 4,
  },
  aiMessage: {
    backgroundColor: "#ffffff",
    alignSelf: "flex-start",
    maxWidth: "90%",
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: "#e8e8e8",
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  userMessageText: {
    color: "#ffffff",
    fontWeight: "500",
  },
  aiMessageText: {
    color: "#333333",
  },
  welcomeSection: {
    marginBottom: 28,
  },
  welcomeText: {
    fontSize: 14,
    color: "#8e92a9",
    fontWeight: "500",
    marginBottom: 8,
  },
  mainTitle: {
    fontSize: 32,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#565869",
    lineHeight: 20,
  },
  portfolioCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: "#e8e8e8",
    elevation: 2,
  },
  portfolioRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  portfolioItem: {
    flex: 1,
  },
  portfolioDivider: {
    width: 1,
    height: 60,
    backgroundColor: "#f0f0f0",
    marginHorizontal: 20,
  },
  portfolioLabel: {
    fontSize: 12,
    color: "#8e92a9",
    fontWeight: "500",
    marginBottom: 6,
  },
  portfolioValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 4,
  },
  portfolioChange: {
    fontSize: 12,
    color: "#10a37f",
    fontWeight: "600",
  },
  actionsSection: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 16,
  },
  actionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "space-between",
  },
  actionCard: {
    width: "48%",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e8e8e8",
    elevation: 1,
  },
  actionIcon: {
    width: 50,
    height: 50,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#000000",
    textAlign: "center",
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 11,
    color: "#8e92a9",
    textAlign: "center",
  },
  featuredSection: {
    marginBottom: 28,
  },
  stocksList: {
    gap: 8,
  },
  stockItem: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e8e8e8",
  },
  stockInfo: {
    flex: 1,
  },
  stockSymbol: {
    fontSize: 13,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 2,
  },
  stockName: {
    fontSize: 11,
    color: "#8e92a9",
  },
  stockRight: {
    alignItems: "flex-end",
  },
  stockPrice: {
    fontSize: 13,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 2,
  },
  stockChange: {
    fontSize: 11,
    fontWeight: "600",
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    paddingTop: 12,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#f8f2e8",
  },
  inputWrapper: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#87bfff",
    elevation: 3,
    gap: 8,
  },
  uploadButton: {
    padding: 4,
  },
  searchIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: "#000000",
    fontWeight: "500",
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#03a6f8",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  inputOnlySpacer: {
    flex: 1,
  },
  resultsContainer: {
    flex: 1,
  },
  stockCardsContainer: {
    gap: 12,
    marginTop: 12,
  },
  stockCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e8e8e8",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  rankBadge: {
    backgroundColor: "#87bfff",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 12,
  },
  rankText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#ffffff",
  },
  symbolText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000000",
    flex: 1,
  },
  companyText: {
    fontSize: 13,
    color: "#6b7280",
    marginBottom: 12,
    lineHeight: 18,
  },
  cardDivider: {
    height: 1,
    backgroundColor: "#f3f4f6",
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    fontSize: 10,
    color: "#9ca3af",
    fontWeight: "600",
    textTransform: "uppercase",
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  priceText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#000000",
  },
  changeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  changeText: {
    fontSize: 13,
    fontWeight: "600",
  },
  percentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  percentText: {
    fontSize: 12,
    fontWeight: "700",
  },
});
