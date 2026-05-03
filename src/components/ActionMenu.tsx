import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity, 
  TouchableWithoutFeedback,
  Platform
} from 'react-native';
import { LucideIcon, X } from 'lucide-react-native';

export interface MenuOption {
  label: string;
  icon: LucideIcon;
  onPress: () => void;
  isDestructive?: boolean;
}

interface ActionMenuProps {
  isVisible: boolean;
  onClose: () => void;
  title?: string;
  options: MenuOption[];
}

export default function ActionMenu({ isVisible, onClose, title, options }: ActionMenuProps) {
  return (
    <Modal
      transparent
      visible={isVisible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.menuContainer}>
              <View style={styles.header}>
                <Text style={styles.title}>{title || 'Opciones'}</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <X color="#94a3b8" size={20} />
                </TouchableOpacity>
              </View>

              <View style={styles.optionsList}>
                {options.map((option, index) => {
                  const Icon = option.icon;
                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.optionItem,
                        index === options.length - 1 && { borderBottomWidth: 0 }
                      ]}
                      onPress={() => {
                        onClose();
                        option.onPress();
                      }}
                    >
                      <View style={[
                        styles.iconCircle, 
                        option.isDestructive ? styles.destructiveBg : styles.normalBg
                      ]}>
                        <Icon 
                          size={18} 
                          color={option.isDestructive ? '#ef4444' : '#3b82f6'} 
                        />
                      </View>
                      <Text style={[
                        styles.optionLabel,
                        option.isDestructive && styles.destructiveText
                      ]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  menuContainer: {
    backgroundColor: '#1e293b',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  closeButton: {
    padding: 4,
  },
  optionsList: {
    paddingHorizontal: 10,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  normalBg: {
    backgroundColor: '#3b82f615',
  },
  destructiveBg: {
    backgroundColor: '#ef444415',
  },
  optionLabel: {
    fontSize: 16,
    color: '#cbd5e1',
    fontWeight: '500',
  },
  destructiveText: {
    color: '#ef4444',
  }
});
