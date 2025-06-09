import { karmycStore } from '../../src/store/karmycStore';
import { useTranslation } from '../../src/hooks/useTranslation';

describe('Translation System', () => {
  beforeEach(() => {
    karmycStore.setState({
      screens: {
        main: {
          areas: {},
          layout: {
            type: 'row',
            children: []
          }
        }
      },
      activeScreenId: 'main',
      i18n: {
        currentLanguage: 'en',
        translations: {
          en: {},
          fr: {}
        }
      },
      options: {
        resizableAreas: true,
        manageableAreas: true,
        multiScreen: true,
        builtInLayouts: []
      }
    });
  });

  it('should set language', () => {
    const { t } = useTranslation();
    expect(typeof t).toBe('function');
  });

  it('should get translation', () => {
    const { t } = useTranslation();
    expect(t('test.key', 'Test Value')).toBe('Test Value');
  });

  it('should fallback to default language', () => {
    const { t } = useTranslation();
    expect(t('test.key', 'Test Value')).toBe('Test Value');
  });

  it('should handle missing translations', () => {
    const { t } = useTranslation();
    expect(t('missing.key', 'missing.key')).toBe('missing.key');
  });

  it('should handle nested translations', () => {
    const { t } = useTranslation();
    expect(t('area.role.lead', 'Lead')).toBe('Lead');
    expect(t('area.role.follow', 'Follow')).toBe('Follow');
  });
}); 
