import { StyleSheet, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
export const COMPACT = SCREEN_WIDTH <= 360;

export function ITEM_MARGIN(compact = false) {
  return compact ? 8 : 16;
}

export const chipStyles = StyleSheet.create({
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'nowrap', // prefer horizontal scroll instead of wrap
    marginTop: 8,
  },
  chipsContainerColumn: {
    flexDirection: 'column',
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1.25,
    marginRight: 8,
    marginBottom: 8,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipCompact: {
    width: '100%',
    alignItems: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  chipText: {
    fontWeight: '700',
  },
});

export const styles = StyleSheet.create({
  container: { flex: 1 },
  headerTitle: { fontWeight: '800', letterSpacing: 0.5, marginBottom: COMPACT ? 8 : 12 },
  tabContainer: { flexDirection: 'row', backgroundColor: '#E5E5EA', borderRadius: 12, padding: 4, marginBottom: 14, marginTop: 6 },
  tabContainerCompact: { flexDirection: 'column', alignItems: 'stretch' },
  tabButton: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', marginHorizontal: 4 },
  tabButtonCompact: { width: '100%', alignItems: 'flex-start', paddingHorizontal: 12, marginBottom: 8 },
  tabText: { fontWeight: '700' },

  // CONTROL BAR: agrupa búsqueda + filtros de forma responsiva
  controlBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: COMPACT ? 8 : 10,
    borderWidth: 1.2,
    borderColor: '#D1D5DB', // Mantener borde por defecto
    backgroundColor: '#fff', // Mantener fondo por defecto
    flex: 1,
    minHeight: COMPACT ? 40 : 48,
  },
  searchInput: { flex: 1, height: COMPACT ? 36 : 44, marginLeft: 8 },

  // filtro principal (chip que abre modal)
  filterChip: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1.2, marginBottom: 0, marginLeft: 8 },
  filterChipText: { marginLeft: 8, fontWeight: '700', fontSize: COMPACT ? 13 : 14 },

  // status / tag
  statusTag: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  statusTagText: { marginLeft: 6, fontSize: 11, fontWeight: '700' },

  /* Card */
  card: {
    flexDirection: 'row',
    borderRadius: 12,
    marginHorizontal: ITEM_MARGIN(),
    marginTop: 12,
    marginBottom: 16,
    elevation: 2,
    overflow: 'hidden',
  },
  cardCompact: {
    marginHorizontal: ITEM_MARGIN(true),
  },
  cardStateBorder: {
    width: 6,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  cardBody: {
    flex: 1,
    padding: 16,
    minHeight: 80,
  },
  cardBodyCompact: {
    padding: 12,
  },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  cardHeaderLeft: { flex: 1, paddingRight: 8, flexShrink: 1 },
  cardTitle: { fontSize: COMPACT ? 15 : 16, fontWeight: '700' },
  cardSubRow: { flexDirection: 'row', marginTop: 6, alignItems: 'center' },
  cardSubtitle: { marginLeft: 8, color: '#6B7280', flexShrink: 1 },

  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  statusPillText: { marginLeft: 6, fontWeight: '700', maxWidth: 140, flexShrink: 1 },

  dateRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  dateIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#17a2b8',
    backgroundColor: '#17a2b8' + '20',
    flexShrink: 0,
  },
  metaLabel: { fontSize: 12 },
  metaValue: { fontWeight: '700', flexShrink: 1, flexWrap: 'wrap' },

  outOfSchedule: {
    marginTop: 8,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F59E0B',
    backgroundColor: '#F59E0B20',
  },
  outOfScheduleText: { marginLeft: 6, color: '#A16207', fontWeight: '700' },

  sectionLabel: { color: '#6B7280', marginBottom: 4, fontSize: COMPACT ? 12 : 13 },
  sectionText: { fontSize: COMPACT ? 13 : 15, lineHeight: 20 },

  cardFooter: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: 12 },
  detailButton: { backgroundColor: '#4F46E5', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, flexDirection: 'row', alignItems: 'center' },
  detailButtonCompact: { paddingVertical: 8, paddingHorizontal: 10 },
  detailButtonText: { color: '#fff', fontWeight: '700', marginLeft: 6 },

  /* Section header */
  sectionHeader: { paddingVertical: 8, paddingHorizontal: 16, borderTopWidth: 1, borderTopColor: '#E6E6E9', marginTop: 6 },
  sectionHeaderText: { fontSize: COMPACT ? 11 : 13, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8 },

  /* Modals */
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: COMPACT ? 12 : 20 },
  actionModalContainer: { borderRadius: 12, paddingVertical: COMPACT ? 12 : 18, paddingHorizontal: COMPACT ? 12 : 14, width: '100%', maxWidth: COMPACT ? 360 : 440, alignItems: 'center' },
  // Mantener colores base en estilos para que puedan ser sobrescritos por temas
  actionCard: { flexDirection: 'row', alignItems: 'center', width: '100%', padding: COMPACT ? 10 : 12, borderRadius: 10, borderWidth: 1.2, marginBottom: 10, borderColor: '#EEE', backgroundColor: '#FFF' },
  actionCardTitle: { fontSize: COMPACT ? 15 : 16, fontWeight: '700' },
  closeButton: { position: 'absolute', top: 12, right: 12, padding: 6 },
  modalTitle: { fontSize: COMPACT ? 16 : 18, fontWeight: '800', marginBottom: 10 },

  gestionModalContainer: { borderRadius: 12, padding: COMPACT ? 12 : 16, width: '100%', maxWidth: COMPACT ? 360 : 440, alignItems: 'center' },
  datePickerButton: { width: '100%', borderWidth: 1.5, borderRadius: 12, padding: COMPACT ? 10 : 12, alignItems: 'center', marginBottom: 12, backgroundColor: '#F8FAFC' },
  label: { fontSize: COMPACT ? 13 : 14, fontWeight: '700' },
  // Mantener el borde neutro para que el estilo inlined lo maneje
  modalInput: { width: '100%', borderWidth: 1.5, borderRadius: 12, padding: 10, minHeight: 80, textAlignVertical: 'top', fontSize: COMPACT ? 13 : 15, marginTop: 6, borderColor: '#CCC' }, 
  modalButton: { width: '100%', padding: COMPACT ? 10 : 12, borderRadius: 12, alignItems: 'center', marginTop: 12 },
  modalButtonText: { color: '#FFF', fontWeight: '800' },

  detalleHeaderTitle: { fontSize: COMPACT ? 18 : 22, fontWeight: '800', marginTop: 8 },
  detalleCloseButton: { position: 'absolute', top: 8, right: 10, padding: 8 },
  detalleSection: { marginBottom: 18 },
  detalleSectionTitle: { fontSize: COMPACT ? 14 : 16, fontWeight: '800', marginBottom: 10 },
  detalleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#EEE' },
  detalleLabel: { fontSize: COMPACT ? 13 : 14, color: '#666' },
  detalleValue: { fontSize: COMPACT ? 13 : 14, fontWeight: '700', flex: 1, textAlign: 'right', marginLeft: 10 },

  reloadButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1 },
});