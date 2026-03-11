import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Settings as SettingsIcon, Camera, Volume2, VolumeX } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { audioManager } from '@/lib/audioManager';
import { toast } from 'sonner';

export default function Settings() {
  const navigate = useNavigate();
  const [scorerName, setScorerName] = useState(() => localStorage.getItem('scorer_name') || '');
  const [avatarUrl, setAvatarUrl] = useState(() => localStorage.getItem('scorer_avatar') || '');
  const [audioEnabled, setAudioEnabled] = useState(() => audioManager.isEnabled());
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    localStorage.setItem('scorer_name', scorerName);
    localStorage.setItem('scorer_avatar', avatarUrl);
    audioManager.setEnabled(audioEnabled);
    toast.success('Settings saved successfully');
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
            <SettingsIcon className="h-6 w-6" /> Settings
          </h1>
        </div>
      </div>

      <div className="mx-auto max-w-lg px-4 -mt-3 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Scorer Profile</CardTitle>
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
            <p className="text-xs text-center text-muted-foreground">Tap to set your avatar</p>

            <div>
              <Label>Scorer Display Name</Label>
              <Input
                value={scorerName}
                onChange={e => setScorerName(e.target.value)}
                placeholder="Enter your name"
                className="h-12 text-base"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sound Effects</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {audioEnabled ? <Volume2 className="h-5 w-5 text-primary" /> : <VolumeX className="h-5 w-5 text-muted-foreground" />}
                <Label>Enable Sound Effects</Label>
              </div>
              <Switch checked={audioEnabled} onCheckedChange={setAudioEnabled} />
            </div>
            {audioEnabled && (
              <Button variant="outline" size="sm" onClick={testSound} className="rounded-xl">
                🔊 Test Sound
              </Button>
            )}
          </CardContent>
        </Card>

        <Button onClick={handleSave} className="w-full h-12 text-base font-bold rounded-xl">
          Save Settings
        </Button>
      </div>
    </div>
  );
}
