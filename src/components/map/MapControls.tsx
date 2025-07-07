import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../config/app';

interface MapControlsProps {
  onCenterUser: () => void;
  onCenterStore: () => void;
  onShowAll: () => void;
  onRotateLeft: () => void;
  onRotateRight: () => void;
  hasUserLocation: boolean;
}

const MapControls: React.FC<MapControlsProps> = ({
  onCenterUser,
  onCenterStore,
  onShowAll,
  onRotateLeft,
  onRotateRight,
  hasUserLocation
}) => {
  return (
    <View style={styles.container}>
      {/* Controles de rotação */}
      <View style={styles.rotationControls}>
        <TouchableOpacity style={styles.controlButton} onPress={onRotateLeft}>
          <Text style={styles.controlIcon}>↺</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlButton} onPress={onRotateRight}>
          <Text style={styles.controlIcon}>↻</Text>
        </TouchableOpacity>
      </View>

      {/* Controles de navegação */}
      <View style={styles.navigationControls}>
        <TouchableOpacity style={styles.controlButton} onPress={onCenterStore}>
          <Text style={styles.controlIcon}>🏪</Text>
        </TouchableOpacity>
        
        {hasUserLocation && (
          <TouchableOpacity style={styles.controlButton} onPress={onCenterUser}>
            <Text style={styles.controlIcon}>📍</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity style={styles.controlButton} onPress={onShowAll}>
          <Text style={styles.controlIcon}>🗺️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 20,
    right: 20,
    gap: 10,
  },
  rotationControls: {
    flexDirection: 'row',
    gap: 8,
  },
  navigationControls: {
    gap: 8,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  controlIcon: {
    fontSize: 18,
    color: COLORS.text,
  },
});

export default MapControls;

