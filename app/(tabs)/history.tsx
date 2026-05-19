import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useMemo, useState } from "react";
import { Alert, FlatList, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useHistory, type HistoryEntry } from "@/context/HistoryContext";
import { HistoryItem } from "@/components/HistoryItem";
import { SearchBar } from "@/components/SearchBar";
import { router } from "expo-router";

type Filter = "all" | "favorites";

export default function HistoryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { entries, removeEntry, toggleFavorite, clearHistory } = useHistory();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = useMemo(() => {
    let result = entries;
    if (filter === "favorites") result = result.filter((e) => e.favorite);
    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(
        (e) => e.formulaName.toLowerCase().includes(q) || e.category.toLowerCase().includes(q)
      );
    }
    return result;
  }, [entries, query, filter]);

  const handleClear = () => {
    if (Platform.OS === "web") {
      clearHistory();
      return;
    }
    Alert.alert("Borrar historial", "¿Seguro que quieres borrar todo el historial?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Borrar",
        style: "destructive",
        onPress: async () => {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          clearHistory();
        },
      },
    ]);
  };

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <FlatList<HistoryEntry>
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          paddingTop: topPad + 16,
          paddingBottom: insets.bottom + 90,
          paddingHorizontal: 20,
          gap: 8,
          flexGrow: 1,
        }}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Text style={[styles.title, { color: colors.foreground }]}>Historial</Text>
              {entries.length > 0 && (
                <TouchableOpacity onPress={handleClear}>
                  <Ionicons name="trash-outline" size={20} color={colors.destructive} />
                </TouchableOpacity>
              )}
            </View>
            <SearchBar value={query} onChangeText={setQuery} placeholder="Buscar en historial..." />
            <View style={styles.filterRow}>
              {(["all", "favorites"] as Filter[]).map((f) => (
                <TouchableOpacity
                  key={f}
                  onPress={() => setFilter(f)}
                  style={[
                    styles.filterBtn,
                    {
                      backgroundColor: filter === f ? colors.primary : colors.card,
                      borderColor: filter === f ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.filterText, { color: filter === f ? colors.primaryForeground : colors.mutedForeground }]}>
                    {f === "all" ? "Todos" : "Favoritos"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <HistoryItem
            entry={item}
            onToggleFavorite={() => toggleFavorite(item.id)}
            onDelete={() => removeEntry(item.id)}
            onRepeat={() => router.push(`/calculator/${item.formulaId}` as never)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="time-outline" size={48} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Sin historial</Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              {filter === "favorites"
                ? "Marca cálculos como favoritos para verlos aquí."
                : "Los cálculos guardados aparecerán aquí."}
            </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { gap: 12, marginBottom: 4 },
  titleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { fontSize: 26, fontFamily: "Inter_700Bold", letterSpacing: -0.5 },
  filterRow: { flexDirection: "row", gap: 8 },
  filterBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 100, borderWidth: 1 },
  filterText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 80, gap: 12 },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold" },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", paddingHorizontal: 40 },
});
