import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Settings as SettingsIcon, Camera, Volume2, VolumeX, Mic, MicOff, Globe } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { audioManager } from '@/lib/audioManager';
import { speechManager } from '@/lib/speechManager';
import { t, getLanguage, setLanguage, LANGUAGES, Language } from '@/lib/i18n';
import { toast } from 'sonner';

export default function Settings() {
  const navigate = useNavigate();
  const [avatarUrl, setAvatarUrl] = useState(() => localStorage.getItem('scorer_avatar') || '');
  const [audioEnabled, setAudioEnabled] = useState(() => audioManager.isEnabled());
  const [commentaryEnabled, setCommentaryEnabled] = useState(() => speechManager.isEnabled());
  const [overSummaryEnabled, setOverSummaryEnabled] = useState(() => speechManager.isOverSummaryEnabled());
  const [selectedLang, setSelectedLang] = useState<Language>(() => getLanguage());
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    try {
      localStorage.setItem('scorer_avatar', avatarUrl);
    } catch (e) {
      console.warn('Failed to save avatar to localStorage:', e);
    }
    audioManager.setEnabled(audioEnabled);
    speechManager.setEnabled(commentaryEnabled);
    speechManager.setOverSummaryEnabled(overSummaryEnabled);
    setLanguage(selectedLang);
    toast.success(t('settings.saved'));
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setAvatarUrl(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const testSound = () => {
    audioManager.playFour();
  };

  return (
    <div className="min-h-screen pb-24">
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
      <div className="cricket-gradient px-4 pb-6 pt-12 text-primary-foreground">
        <div className="mx-auto max-w-lg">
          <button onClick={() => navigate('/')} className="mb-3 flex items-center gap-1 text-sm opacity-80 hover:opacity-100">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <h1 className="text-2xl font-black flex items-center gap-2">
            <SettingsIcon className="h-6 w-6" /> {t('settings.title')}
          </h1>
        </div>
      </div>

      <div className="mx-auto max-w-lg px-4 -mt-3 space-y-4">
        {/* Language */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="h-4 w-4" /> {t('settings.language')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedLang} onValueChange={v => setSelectedLang(v as Language)}>
              <SelectTrigger>
                <SelectValue placeholder={t('settings.selectLanguage')} />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map(lang => (
                  <SelectItem key={lang.code} value={lang.code}>
                    {lang.nativeLabel} ({lang.label})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Scorer Profile - Avatar only */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('settings.scorerProfile')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-center">
              <button
                onClick={() => fileRef.current?.click()}
                className="w-20 h-20 rounded-full bg-muted flex items-center justify-center overflow-hidden border-2 border-dashed border-border hover:border-primary transition-colors"
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <Camera className="h-8 w-8 text-muted-foreground" />
                )}
              </button>
            </div>
            <p className="text-xs text-center text-muted-foreground">{t('settings.avatar')}</p>
          </CardContent>
        </Card>

        {/* Sound Effects */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('settings.soundEffects')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {audioEnabled ? <Volume2 className="h-5 w-5 text-primary" /> : <VolumeX className="h-5 w-5 text-muted-foreground" />}
                <Label>{t('settings.enableSound')}</Label>
              </div>
              <Switch checked={audioEnabled} onCheckedChange={setAudioEnabled} />
            </div>
            {audioEnabled && (
              <Button variant="outline" size="sm" onClick={testSound} className="rounded-xl">
                🔊 {t('settings.testSound')}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Live Commentary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('settings.liveCommentary')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {commentaryEnabled ? <Mic className="h-5 w-5 text-primary" /> : <MicOff className="h-5 w-5 text-muted-foreground" />}
                <Label>{t('settings.enableCommentary')}</Label>
              </div>
              <Switch checked={commentaryEnabled} onCheckedChange={setCommentaryEnabled} />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Label className="text-sm">{t('settings.enableOverSummary')}</Label>
              </div>
              <Switch checked={overSummaryEnabled} onCheckedChange={setOverSummaryEnabled} />
            </div>
          </CardContent>
        </Card>

        <Button onClick={handleSave} className="w-full h-12 text-base font-bold rounded-xl">
          {t('settings.save')}
        </Button>
      </div>
    </div>
  );
}
