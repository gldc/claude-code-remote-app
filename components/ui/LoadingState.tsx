import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { useColors } from '../../constants/theme';

export function LoadingState() {
  const colors = useColors();
  return (
    <View style={styles.container}>
      <ActivityIndicator color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
