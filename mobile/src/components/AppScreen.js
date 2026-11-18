import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import colors from '../theme/colors';

export default function AppScreen({ title, subtitle, children, scroll = true }) {
  const content = (
    <>
      <View style={styles.brandRow}>
        <View style={styles.brandMark}>
          <Text style={styles.brandMarkText}>A</Text>
        </View>
        <View style={styles.brandCopy}>
          <Text style={styles.brandName}>ALERTA CIDADÃO</Text>
          <Text style={styles.brandCaption}>Monitoramento e prevenção</Text>
        </View>
      </View>
      <View style={styles.header}>
        <View style={styles.titleAccent} />
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {children}
    </>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {content}
        </ScrollView>
      ) : (
        <View style={styles.content}>{content}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 36,
    flexGrow: 1,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
    paddingBottom: 17,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  brandMark: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },
  brandMarkText: { color: colors.textLight, fontSize: 21, fontWeight: '900' },
  brandCopy: { flex: 1 },
  brandName: {
    color: colors.primaryDark,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.1,
  },
  brandCaption: { color: colors.textSecondary, fontSize: 11, marginTop: 3 },
  header: { marginBottom: 22 },
  titleAccent: {
    width: 34,
    height: 4,
    borderRadius: 3,
    backgroundColor: colors.secondary,
    marginBottom: 11,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 7,
    lineHeight: 21,
  },
});
