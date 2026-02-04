import { Feather } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

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

type StockCardsProps = {
  cards: StockCard[];
  message?: string;
};

export default function StockCards({ cards, message }: StockCardsProps) {
  if (cards.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Feather name="inbox" size={48} color="#d1d5db" />
        <Text style={styles.emptyText}>No stocks to display</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Display Message */}
      {message && (
        <View style={styles.messageBox}>
          <Text style={styles.messageText}>{message}</Text>
        </View>
      )}

      {/* Stock Cards */}
      <View style={styles.cardsContainer}>
        {cards.map((stock, index) => (
          <View key={`${stock.symbol}-${index}`} style={styles.stockCard}>
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
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 14,
    color: "#9ca3af",
    marginTop: 12,
    fontWeight: "500",
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
  cardsContainer: {
    gap: 12,
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
