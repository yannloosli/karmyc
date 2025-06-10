import { renderHook } from '@testing-library/react';
import { useKarmycStore } from '../../src/store/areaStore';
import { useTranslation } from '../../src/hooks/useTranslation';
import { TestWrapper } from '../utils/TestWrapper';

describe('Translation System', () => {
  beforeEach(() => {
    useKarmycStore.setState({
      screens: {
        main: {
          areas: {
            _id: 0,
            rootId: null,
            errors: [],
            activeAreaId: null,
            joinPreview: null,
            layout: {},
            areas: {},
            viewports: {},
            areaToOpen: null,
            lastSplitResultData: null,
            lastLeadAreaId: null
          }
        }
      },
      activeScreenId: 'main',
      options: {
        keyboardShortcutsEnabled: true,
        builtInLayouts: [],
        validators: [],
        resizableAreas: true,
        manageableAreas: true,
        multiScreen: false,
        t: (_key: string, fallback: string) => fallback
      }
    });
  });

  it('should set language', () => {
    const { result } = renderHook(() => useTranslation(), {
      wrapper: TestWrapper
    });
    expect(typeof result.current.t).toBe('function');
  });

  it('should get translation', () => {
    const { result } = renderHook(() => useTranslation(), {
      wrapper: TestWrapper
    });
    expect(result.current.t('test.key', 'Test Value')).toBe('Test Value');
  });

  it('should fallback to default language', () => {
    const { result } = renderHook(() => useTranslation(), {
      wrapper: TestWrapper
    });
    expect(result.current.t('test.key', 'Test Value')).toBe('Test Value');
  });

  it('should handle missing translations', () => {
    const { result } = renderHook(() => useTranslation(), {
      wrapper: TestWrapper
    });
    expect(result.current.t('missing.key', 'missing.key')).toBe('missing.key');
  });

  it('should handle nested translations', () => {
    const { result } = renderHook(() => useTranslation(), {
      wrapper: TestWrapper
    });
    expect(result.current.t('area.role.lead', 'Lead')).toBe('Lead');
    expect(result.current.t('area.role.follow', 'Follow')).toBe('Follow');
  });
}); 
