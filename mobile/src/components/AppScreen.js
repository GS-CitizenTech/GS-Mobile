import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import colors from '../theme/colors';

export default function AppScreen({
  title,
  subtitle,
  children,
  scroll = true,
}) {
  return (
    <SafeAreaView style={styles.safeArea}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>

            {subtitle ? (
              <Text style={styles.subtitle}>{subtitle}</Text>
            ) : null}
          </View>

          {children}
        </ScrollView>
      ) : (
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>

            {subtitle ? (
              <Text style={styles.subtitle}>{subtitle}</Text>
            ) : null}
          </View>

          {children}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },

  content: {
    padding: 20,
    paddingBottom: 32,
    flexGrow: 1,
  },

  header: {
    marginBottom: 24,
  },

  title: {
    fontSize: 27,
    fontWeight: 'bold',
    color: colors.text,
  },

  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 7,
    lineHeight: 21,
  },
});