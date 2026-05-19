import React, { useMemo, useState } from "react";
import {
  Platform,
  SectionList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { CalculatorCard } from "@/components/CalculatorCard";
import { SearchBar } from "@/components/SearchBar";
import { getAllFormulas, type Formula } from "@/engine/formulaRegistry";
import { router } from "expo-router";

export default function CalculatorsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const allFormulas = getAllFormulas();

  const sections = useMemo(() => {
    const filtered = query.trim()
      ? allFormulas.filter(
          (f) =>
            f.name.toLowerCase().includes(query.toLowerCase()) ||
            f.category.toLowerCase().includes(query.toLowerCase()) ||
            f.description.toLowerCase().includes(query.toLowerCase())
        )
      : allFormulas;

    const byCategory: Record<string, Formula[]> = {};
    for (const f of filtered) {
      if (!byCategory[f.category]) byCategory[f.category] = [];
      byCategory[f.category].push(f);
    }
    return Object.entries(byCategory).map(([title, data]) => ({ title, data }));
  }, [query, allFormulas]);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          paddingTop: topPad + 16,
          paddingBottom: insets.bottom + 90,
          paddingHorizontal: 20,
          gap: 6,
        }}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.foreground }]}>Calculadoras</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              {allFormulas.length} calculadoras técnicas disponibles
            </Text>
            <View style={styles.searchWrap}>
              <SearchBar value={query} onChangeText={setQuery} />
            </View>
          </View>
        }
        renderSectionHeader={({ section }) => (
          <View style={[styles.sectionHeader, { backgroundColor: colors.background }]}>
            <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
              {section.title.toUpperCase()}
            </Text>
          </View>
        )}
        renderItem={({ item }) => (
          <View style={styles.itemWrap}>
            <CalculatorCard
              id={item.id}
              name={item.name}
              category={item.category}
              description={item.description}
              icon={item.icon}
              needsReview={item.needsReview}
            />
          </View>
        )}
        stickySectionHeadersEnabled={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              No se encontraron calculadoras para "{query}"
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
  header: { gap: 6, marginBottom: 8 },
  title: { fontSize: 26, fontFamily: "Inter_700Bold", letterSpacing: -0.5 },
  subtitle: { fontSize: 13, fontFamily: "Inter_400Regular" },
  searchWrap: { marginTop: 8 },
  sectionHeader: { paddingVertical: 10 },
  sectionTitle: { fontSize: 11, fontFamily: "Inter_700Bold", letterSpacing: 1.2 },
  itemWrap: { marginBottom: 8 },
  empty: { paddingTop: 40, alignItems: "center" },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
});
