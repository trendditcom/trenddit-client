'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/lib/ui/button';
import { Textarea } from '@/lib/ui/textarea';
import { Label } from '@/lib/ui/label';
import { Switch } from '@/lib/ui/switch';
import { Slider } from '@/lib/ui/slider';
import { Badge } from '@/lib/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/lib/ui/tabs';
import { Alert, AlertDescription } from '@/lib/ui/alert';
import { 
  Settings, 
  Save, 
  RotateCcw, 
  AlertTriangle, 
  CheckCircle, 
  Info,
  Lock,
  Edit3,
  ArrowLeft,
  Zap
} from 'lucide-react';
import { TrendPromptSettings, DEFAULT_TREND_SETTINGS, SettingsState } from '@/features/trends/types/settings';

const SETTINGS_STORAGE_KEY = 'trenddit_prompt_settings';

export default function SettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<TrendPromptSettings>(DEFAULT_TREND_SETTINGS);
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (stored) {
        const parsedSettings: SettingsState = JSON.parse(stored);
        setSettings(parsedSettings.prompts);
      }
    } catch (error) {
      console.warn('Failed to load settings from localStorage:', error);
    }
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save to localStorage
      const settingsState: SettingsState = {
        prompts: settings,
        lastUpdated: new Date().toISOString(),
        version: 1
      };
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settingsState));
      
      setHasChanges(false);
      setSaveSuccess(true);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setSettings(DEFAULT_TREND_SETTINGS);
    setHasChanges(true);
    setSaveSuccess(false);
  };

  const updateUserPrompt = (field: keyof typeof settings.userPrompt, value: string) => {
    setSettings(prev => ({
      ...prev,
      userPrompt: {
        ...prev.userPrompt,
        [field]: value
      }
    }));
    setHasChanges(true);
    setSaveSuccess(false);
  };

  const updateUrlVerification = (field: keyof typeof settings.urlVerification, value: boolean | number) => {
    setSettings(prev => ({
      ...prev,
      urlVerification: {
        ...prev.urlVerification,
        [field]: value
      }
    }));
    setHasChanges(true);
    setSaveSuccess(false);
  };

  const updateModelSettings = (field: keyof typeof settings.modelSettings, value: number) => {
    setSettings(prev => ({
      ...prev,
      modelSettings: {
        ...prev.modelSettings,
        [field]: value
      }
    }));
    setHasChanges(true);
    setSaveSuccess(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      
      {/* Header */}
      <div className="border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  onClick={() => router.back()}
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
                <div className="h-8 w-px bg-gray-300"></div>
                <div className="flex items-center gap-3">
                  <Settings className="h-6 w-6 text-indigo-600" />
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                      Trend Generation Settings
                    </h1>
                    <p className="text-gray-600 mt-1">
                      Configure how AI trends are generated and verified
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                {/* Save Status */}
                {saveSuccess && (
                  <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-2 rounded-lg">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">Settings saved!</span>
                  </div>
                )}
                
                {hasChanges && !saveSuccess && (
                  <Badge variant="outline" className="text-yellow-600 border-yellow-200 bg-yellow-50">
                    <Zap className="h-3 w-3 mr-1" />
                    Unsaved Changes
                  </Badge>
                )}

                <Button variant="outline" onClick={handleReset}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset to Defaults
                </Button>
                
                <Button 
                  onClick={handleSave}
                  disabled={!hasChanges || saving}
                  className="min-w-[120px]"
                >
                  {saving ? (
                    <>Saving...</>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Settings
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <Tabs defaultValue="prompts" className="w-full">
            <div className="border-b border-gray-200 bg-gray-50">
              <TabsList className="w-full justify-start rounded-none bg-transparent p-0">
                <TabsTrigger 
                  value="prompts" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-500 data-[state=active]:bg-white px-8 py-4"
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  Prompt Configuration
                </TabsTrigger>
                <TabsTrigger 
                  value="urls" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-500 data-[state=active]:bg-white px-8 py-4"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  URL Verification
                </TabsTrigger>
                <TabsTrigger 
                  value="model" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-500 data-[state=active]:bg-white px-8 py-4"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Model Settings
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="p-8">
              <TabsContent value="prompts" className="space-y-8 mt-0">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Configure how trends are generated. Only user-editable sections can be modified - system-controlled parts ensure app stability.
                  </AlertDescription>
                </Alert>

                {/* User-Editable Prompts */}
                <div className="space-y-8">
                  <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
                    <Edit3 className="h-5 w-5 text-green-600" />
                    <h2 className="text-xl font-semibold text-gray-900">User-Editable Prompts</h2>
                    <Badge variant="outline" className="text-green-600 border-green-200">
                      Customizable
                    </Badge>
                  </div>

                  <div className="grid gap-8">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="trendFocus" className="text-base font-medium text-gray-900">
                          Trend Focus & Priorities
                        </Label>
                        <p className="text-sm text-gray-600 mb-3">
                          Define what types of trends to prioritize and their characteristics
                        </p>
                        <Textarea
                          id="trendFocus"
                          value={settings.userPrompt.trendFocus}
                          onChange={(e) => updateUserPrompt('trendFocus', e.target.value)}
                          className="min-h-[120px]"
                          placeholder="Define what types of trends to prioritize..."
                        />
                      </div>

                      <div>
                        <Label htmlFor="industryContext" className="text-base font-medium text-gray-900">
                          Industry Context & Target Audience
                        </Label>
                        <p className="text-sm text-gray-600 mb-3">
                          Specify target industries, business contexts, and audience characteristics
                        </p>
                        <Textarea
                          id="industryContext"
                          value={settings.userPrompt.industryContext}
                          onChange={(e) => updateUserPrompt('industryContext', e.target.value)}
                          className="min-h-[100px]"
                          placeholder="Describe target industries and business contexts..."
                        />
                      </div>

                      <div>
                        <Label htmlFor="timeframeContext" className="text-base font-medium text-gray-900">
                          Timeframe & Currency Requirements
                        </Label>
                        <p className="text-sm text-gray-600 mb-3">
                          Define how current and specific trends should be, including data requirements
                        </p>
                        <Textarea
                          id="timeframeContext"
                          value={settings.userPrompt.timeframeContext}
                          onChange={(e) => updateUserPrompt('timeframeContext', e.target.value)}
                          className="min-h-[100px]"
                          placeholder="Specify how current and specific trends should be..."
                        />
                      </div>

                      <div>
                        <Label htmlFor="sourcePreferences" className="text-base font-medium text-gray-900">
                          Source Preferences & Quality Requirements
                        </Label>
                        <p className="text-sm text-gray-600 mb-3">
                          Specify preferred sources, URL requirements, and quality standards
                        </p>
                        <Textarea
                          id="sourcePreferences"
                          value={settings.userPrompt.sourcePreferences}
                          onChange={(e) => updateUserPrompt('sourcePreferences', e.target.value)}
                          className="min-h-[100px]"
                          placeholder="Define preferred sources and URL requirements..."
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* System-Controlled Prompts (Read-Only) */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
                    <Lock className="h-5 w-5 text-gray-600" />
                    <h2 className="text-xl font-semibold text-gray-900">System-Controlled Prompts</h2>
                    <Badge variant="outline" className="text-gray-600 border-gray-200">
                      Protected
                    </Badge>
                  </div>

                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      These sections are controlled by the application to ensure proper functionality and cannot be modified.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-6 bg-gray-50 p-6 rounded-lg border border-gray-200">
                    <div>
                      <Label className="text-base font-medium text-gray-700">Response Format</Label>
                      <p className="text-sm text-gray-600 mt-2 leading-relaxed">{settings.systemPrompt.responseFormat}</p>
                    </div>
                    <div>
                      <Label className="text-base font-medium text-gray-700">Validation Rules</Label>
                      <p className="text-sm text-gray-600 mt-2 leading-relaxed">{settings.systemPrompt.validationRules}</p>
                    </div>
                    <div>
                      <Label className="text-base font-medium text-gray-700">Category Requirements</Label>
                      <p className="text-sm text-gray-600 mt-2 leading-relaxed">{settings.systemPrompt.categoryRequirements}</p>
                    </div>
                    <div>
                      <Label className="text-base font-medium text-gray-700">URL Validation Rules</Label>
                      <p className="text-sm text-gray-600 mt-2 leading-relaxed">{settings.systemPrompt.urlValidationRules}</p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="urls" className="space-y-8 mt-0">
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    URL verification helps ensure source links point to real articles, not fake/generated URLs.
                  </AlertDescription>
                </Alert>

                <div className="space-y-8">
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div className="space-y-2">
                        <Label className="text-base font-medium text-gray-900">Enable URL Verification</Label>
                        <p className="text-sm text-gray-600">
                          Verify that source URLs are real and accessible before displaying them to users
                        </p>
                      </div>
                      <Switch
                        checked={settings.urlVerification.enabled}
                        onCheckedChange={(checked) => updateUrlVerification('enabled', checked)}
                      />
                    </div>

                    <div className="space-y-6">
                      <div>
                        <Label className="text-base font-medium text-gray-900 mb-3 block">
                          Verification Timeout: {settings.urlVerification.timeout}ms
                        </Label>
                        <Slider
                          value={[settings.urlVerification.timeout]}
                          onValueChange={([value]) => updateUrlVerification('timeout', value)}
                          max={15000}
                          min={1000}
                          step={500}
                          className="w-full"
                        />
                        <p className="text-sm text-gray-600 mt-2">
                          Maximum time to wait when checking if URLs are accessible (1-15 seconds)
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                        <div className="space-y-2">
                          <Label className="text-base font-medium text-gray-900">Fallback to Generated URLs</Label>
                          <p className="text-sm text-gray-600">
                            If real URLs fail verification, use generated placeholder URLs instead of showing no link
                          </p>
                        </div>
                        <Switch
                          checked={settings.urlVerification.fallbackToGenerated}
                          onCheckedChange={(checked) => updateUrlVerification('fallbackToGenerated', checked)}
                        />
                      </div>

                      {!settings.urlVerification.fallbackToGenerated && (
                        <Alert>
                          <CheckCircle className="h-4 w-4" />
                          <AlertDescription>
                            <strong>Recommended:</strong> Disabled fallback means only verified real URLs will be shown, 
                            preventing users from clicking on fake/generated links.
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="model" className="space-y-8 mt-0">
                <div className="space-y-8">
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="space-y-8">
                      <div>
                        <Label className="text-base font-medium text-gray-900 mb-3 block">
                          Temperature: {settings.modelSettings.temperature}
                        </Label>
                        <Slider
                          value={[settings.modelSettings.temperature]}
                          onValueChange={([value]) => updateModelSettings('temperature', value)}
                          max={1}
                          min={0}
                          step={0.1}
                          className="w-full"
                        />
                        <p className="text-sm text-gray-600 mt-2">
                          Controls creativity vs focus. Higher values (0.8-1.0) make output more creative and varied, 
                          lower values (0.1-0.3) make it more focused and deterministic.
                        </p>
                      </div>

                      <div className="pt-6 border-t border-gray-200">
                        <Label className="text-base font-medium text-gray-900 mb-3 block">
                          Max Tokens: {settings.modelSettings.maxTokens}
                        </Label>
                        <Slider
                          value={[settings.modelSettings.maxTokens]}
                          onValueChange={([value]) => updateModelSettings('maxTokens', value)}
                          max={4000}
                          min={1000}
                          step={100}
                          className="w-full"
                        />
                        <p className="text-sm text-gray-600 mt-2">
                          Maximum number of tokens (words/pieces) in the AI response. Higher values allow for more detailed trends but cost more.
                        </p>
                      </div>
                    </div>
                  </div>

                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Model:</strong> Currently using gpt-4o-mini for optimal cost/performance balance. 
                      Model selection may become configurable in future versions.
                    </AlertDescription>
                  </Alert>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
}