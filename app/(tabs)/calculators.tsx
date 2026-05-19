import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
  Platform,
  SectionList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { CalculatorCard } from "@/components/CalculatorCard";
import { SearchBar } from "@/components/SearchBar";
import { getAllFormulas, type Formula } from "@/engine/formulaRegistry";
import { router } from "expo-router";
import flangeData from "@/data/flangeTables.json";

type Section = { title: string; data: Formula[]; isSpecial?: boolean };

export default function CalculatorsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const allFormulas = getAllFormulas();

  const sections = useMemo<Section[]>(() => {
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

    const formulaSections: Section[] = Object.entries(byCategory).map(([title, data]) => ({
      title,
      data,
    }));

    // Add "Tablas Técnicas" section when not filtering, or when query matches
    const showTables =
      !query.trim() ||
      "bridas".includes(query.toLowerCase()) ||
      "flanges".includes(query.toLowerCase()) ||
      "tablas".includes(query.toLowerCase());

    if (showTables) {
      formulaSections.push({
        title: "Tablas Técnicas",
        data: [],
        isSpecial: true,
      });
    }

    return formulaSections;
  }, [query, allFormulas]);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <SectionList<Formula, Section>
        sections={sections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          paddingTop: topPad + 16,
          paddingBottom: insets.bottom + 90,
          paddingHorizontal: 20,
        }}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.foreground }]}>Calculadoras</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              {allFormulas.length} calculadoras · {flangeData.flanges.length} entradas de bridas
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
        renderItem={({ item, section }) => {
          if ((section as Section).isSpecial) return null;
          return (
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
          );
        }}
        renderSectionFooter={({ section }) => {
          if (!(section as Section).isSpecial) return null;
          return (
            <View style={styles.tablesSection}>
              {/* Flanges */}
              <TouchableOpacity
                onPress={() => router.push("/flanges")}
                style={[styles.tableCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                activeOpacity={0.8}
              >
                <View style={[styles.tableIcon, { backgroundColor: colors.primary + "22" }]}>
                  <MaterialCommunityIcons name="pipe-wrench" size={24} color={colors.primary} />
                </View>
                <View style={styles.tableMeta}>
                  <Text style={[styles.tableName, { color: colors.foreground }]}>
                    Bridas / Flanges API 6A
                  </Text>
                  <Text style={[styles.tableDesc, { color: colors.mutedForeground }]}>
                    {flangeData.flanges.length} entradas · Ring gasket, stud bolt, torque
                  </Text>
                  <View style={styles.tableTagRow}>
                    <View style={[styles.tableTag, { backgroundColor: colors.secondary }]}>
                      <Text style={[styles.tableTagText, { color: colors.mutedForeground }]}>
                        2000–15000 psi
                      </Text>
                    </View>
                    <View style={[styles.tableTag, { backgroundColor: "#F59E0B22" }]}>
                      <Text style={[styles.tableTagText, { color: "#F59E0B" }]}>
                        REVISAR vs Excel
                      </Text>
                    </View>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
          );
        }}
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
  tablesSection: { gap: 8, marginBottom: 8 },
  tableCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 14,
  },
  tableIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  tableMeta: { flex: 1, gap: 4 },
  tableName: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  tableDesc: { fontSize: 12, fontFamily: "Inter_400Regular" },
  tableTagRow: { flexDirection: "row", gap: 6, flexWrap: "wrap", marginTop: 2 },
  tableTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  tableTagText: { fontSize: 10, fontFamily: "Inter_500Medium" },
  empty: { paddingTop: 40, alignItems: "center" },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
});
