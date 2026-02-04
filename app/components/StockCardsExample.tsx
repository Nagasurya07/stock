import { Feather } from "@expo/vector-icons";
import { ScrollView, StyleSheet, Text, View } from "react-native";

// Example data structure that queryreplicat.js returns
const sampleData = {
  success: true,
  displayMessage:
    "✅ Found 10 stocks matching your query\n📈 Data source: NIFTY 100\n⏱️ Processing time: 5.04s",
  cards: [
    {
      rank: 1,
      symbol: "ADANIENT",
      company: "Adani Enterprises Limited",
      price: "₹2,206.50",
      change: "+₹211.10",
      percentChange: "+10.58%",
      changeColor: "#10a37f",
      percentChangeColor: "#10a37f",
    },
    {
      rank: 2,
      symbol: "ADANIGREEN",
      company: "Adani Green Energy Limited",
      price: "₹932.00",
      change: "+₹88.05",
      percentChange: "+10.43%",
      changeColor: "#10a37f",
      percentChangeColor: "#10a37f",
    },
    {
      rank: 3,
      symbol: "TCS",
      company: "Tata Consultancy Services Limited",
      price: "₹3,450.25",
      change: "-₹45.30",
      percentChange: "-1.30%",
      changeColor: "#ef4444",
      percentChangeColor: "#ef4444",
    },
    {
      rank: 4,
      symbol: "INFY",
      company: "Infosys Limited",
      price: "₹1,523.40",
      change: "+₹22.15",
      percentChange: "+1.47%",
      changeColor: "#10a37f",
      percentChangeColor: "#10a37f",
    },
    {
      rank: 5,
      symbol: "RELIANCE",
      company: "Reliance Industries Limited",
      price: "₹2,845.60",
      change: "₹0.00",
      percentChange: "0.00%",
      changeColor: "#8e92a9",
      percentChangeColor: "#8e92a9",
    },
  ],
};

/**
 * Example component showing how stock cards are displayed
 * This is what users will see when they query stocks
 */
export default function StockCardsExample() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Stock Query Results</Text>

      {/* Display Message */}
      <View style={styles.messageBox}>
        <Text style={styles.messageText}>{sampleData.displayMessage}</Text>
      </View>

      {/* Stock Cards */}
      <ScrollView style={styles.scrollView}>
        {sampleData.cards.map((stock, index) => (
          <View key={index} style={styles.stockCard}>
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
            <View style={styles.divider} />

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
                    style={[styles.changeText, { color: stock.changeColor }]}
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
                      backgroundColor: stock.percentChange.startsWith("+")
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
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f2e8",
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 16,
  },
  messageBox: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e8e8e8",
  },
  messageText: {
    fontSize: 13,
    color: "#374151",
    lineHeight: 20,
  },
  scrollView: {
    flex: 1,
  },
  stockCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
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
  divider: {
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
