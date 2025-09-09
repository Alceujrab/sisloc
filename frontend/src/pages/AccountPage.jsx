import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { authService, customerPortalService } from '../services/api';
import { useAuth } from '../context/AuthContext';

function AccountPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pwdSaving, setPwdSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);
  const [profile, setProfile] = useState({ name: '', email: '', phone: '', address: '', city: '', state: '', zip_code: '' });
  const [pwd, setPwd] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [useSelfieCamera, setUseSelfieCamera] = useState(true);
  const { refreshUser } = useAuth();

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data } = await authService.getProfile();
        if (!active) return;
  const u = data.data.user || {};
  setProfile(p => ({ ...p, name: u.name || '', email: u.email || '', phone: u.phone || '', address: u.address || '', city: u.city || '', state: u.state || '', zip_code: u.zip_code || '', avatar: u.avatar || '' }));
      } catch (e) {
        setErr('Falha ao carregar perfil');
      } finally {
        setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const saveProfile = async () => {
    setSaving(true); setMsg(null); setErr(null);
    try {
      const payload = { name: profile.name, phone: profile.phone, address: profile.address, city: profile.city, state: profile.state, zip_code: profile.zip_code };
      await authService.updateProfile(payload);
      setMsg('Perfil atualizado.');
    } catch (e) {
      setErr(e.response?.data?.message || 'Erro ao salvar.');
    } finally { setSaving(false); }
  };

  const changePassword = async () => {
    setPwdSaving(true); setMsg(null); setErr(null);
    if (pwd.newPassword !== pwd.confirmPassword) { setErr('As senhas não conferem.'); setPwdSaving(false); return; }
    try {
      await authService.changePassword({ currentPassword: pwd.currentPassword, newPassword: pwd.newPassword });
      setMsg('Senha atualizada.');
      setPwd({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (e) {
      setErr(e.response?.data?.message || 'Erro ao atualizar senha.');
    } finally { setPwdSaving(false); }
  };

  // Carrega imagem, recorta em quadrado, redimensiona e exporta JPEG/WebP
  const compressAndCrop = (file, maxSize = 512, mime = 'image/jpeg', quality = 0.8) => new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const minSide = Math.min(img.width, img.height);
      const sx = Math.floor((img.width - minSide) / 2);
      const sy = Math.floor((img.height - minSide) / 2);
      const canvas = document.createElement('canvas');
      canvas.width = maxSize; canvas.height = maxSize;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, maxSize, maxSize);
      canvas.toBlob((blob) => {
        if (!blob) return reject(new Error('Falha ao processar imagem'));
        const out = new File([blob], file.name.replace(/\.[^.]+$/, mime === 'image/webp' ? '.webp' : '.jpg'), { type: mime });
        resolve(out);
      }, mime, quality);
    };
    img.onerror = () => reject(new Error('Não foi possível carregar a imagem'));
    img.src = URL.createObjectURL(file);
  });

  const onSelectAvatar = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarPreview(URL.createObjectURL(file));
    setAvatarUploading(true); setMsg(null); setErr(null);
    try {
      // tenta WebP primeiro (melhor compressão), cai para JPEG se não suportado
      let compressed;
      try {
        compressed = await compressAndCrop(file, 512, 'image/webp', 0.8);
      } catch {
        compressed = await compressAndCrop(file, 512, 'image/jpeg', 0.8);
      }
      await customerPortalService.uploadAvatar(compressed || file);
      await refreshUser();
      setMsg('Foto atualizada.');
    } catch (e) {
      const detail = e.response?.data?.message || e.message || 'Falha ao enviar foto.';
      setErr(detail + ' Verifique o formato (JPG/PNG/WEBP) e tamanho (máx 10MB).');
    } finally { setAvatarUploading(false); }
  };

  return (
    <section className="py-8">
      <div className="max-w-5xl mx-auto px-4">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Minha Conta</h1>
          <Link to="/portal" className="text-blue-600 hover:text-blue-700 text-sm">Voltar ao Portal</Link>
        </div>
        {msg && <div className="mb-4 p-3 rounded bg-green-50 text-green-700 text-sm">{msg}</div>}
        {err && <div className="mb-4 p-3 rounded bg-red-50 text-red-700 text-sm">{err}</div>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border rounded-lg p-4">
            <h2 className="font-semibold mb-3">Foto do perfil</h2>
            <div className="flex items-center gap-4">
              {avatarPreview || profile.avatar ? (
                <img src={avatarPreview || profile.avatar} alt="avatar" className="w-20 h-20 rounded-full object-cover border" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gray-200 border flex items-center justify-center text-gray-500">Sem foto</div>
              )}
              <div className="text-sm text-gray-700">
                <div className="flex items-center gap-2 mb-2">
                  <label className="flex items-center gap-2 text-xs text-gray-600">
                    <input type="checkbox" className="rounded" checked={useSelfieCamera} onChange={(e)=>setUseSelfieCamera(e.target.checked)} />
                    Usar câmera frontal (selfie)
                  </label>
                </div>
                <label className="inline-flex items-center px-3 py-2 border rounded cursor-pointer hover:bg-gray-50">
                  <input type="file" accept="image/*" capture={useSelfieCamera ? 'user' : 'environment'} className="hidden" onChange={onSelectAvatar} />
                  Tirar foto/Anexar
                </label>
                <div className="text-xs text-gray-500 mt-1">Formatos: JPG/PNG/WEBP. Máx 10MB.</div>
                {avatarUploading && <div className="text-xs text-gray-600 mt-1">Enviando...</div>}
              </div>
            </div>
          </div>
          <div className="bg-white border rounded-lg p-4">
            <h2 className="font-semibold mb-3">Dados pessoais</h2>
            <div className="space-y-3 text-sm text-gray-700">
              <div>
                <label className="block text-gray-500">Nome</label>
                <input className="w-full border rounded px-3 py-2" placeholder="Seu nome" value={profile.name} onChange={(e)=>setProfile(p=>({...p, name: e.target.value}))} disabled={loading} />
              </div>
              <div>
                <label className="block text-gray-500">E-mail</label>
                <input className="w-full border rounded px-3 py-2" placeholder="email@exemplo.com" value={profile.email} disabled />
              </div>
              <div>
                <label className="block text-gray-500">Telefone</label>
                <input className="w-full border rounded px-3 py-2" placeholder="(00) 00000-0000" value={profile.phone} onChange={(e)=>setProfile(p=>({...p, phone: e.target.value}))} disabled={loading} />
              </div>
              <button onClick={saveProfile} disabled={saving || loading} className="mt-2 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">{saving ? 'Salvando...' : 'Salvar'}</button>
            </div>
          </div>

          <div className="bg-white border rounded-lg p-4">
            <h2 className="font-semibold mb-3">Segurança</h2>
            <div className="space-y-3 text-sm text-gray-700">
              <div>
                <label className="block text-gray-500">Senha atual</label>
                <input type="password" className="w-full border rounded px-3 py-2" value={pwd.currentPassword} onChange={(e)=>setPwd(s=>({...s, currentPassword: e.target.value}))} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-500">Nova senha</label>
                  <input type="password" className="w-full border rounded px-3 py-2" value={pwd.newPassword} onChange={(e)=>setPwd(s=>({...s, newPassword: e.target.value}))} />
                </div>
                <div>
                  <label className="block text-gray-500">Confirmar nova senha</label>
                  <input type="password" className="w-full border rounded px-3 py-2" value={pwd.confirmPassword} onChange={(e)=>setPwd(s=>({...s, confirmPassword: e.target.value}))} />
                </div>
              </div>
              <button onClick={changePassword} disabled={pwdSaving} className="mt-2 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">{pwdSaving ? 'Atualizando...' : 'Atualizar senha'}</button>
            </div>
          </div>

          <div className="bg-white border rounded-lg p-4">
            <h2 className="font-semibold mb-3">Endereço</h2>
            <div className="space-y-3 text-sm text-gray-700">
              <input className="w-full border rounded px-3 py-2" placeholder="Endereço" value={profile.address} onChange={(e)=>setProfile(p=>({...p, address: e.target.value}))} />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input className="border rounded px-3 py-2" placeholder="Cidade" value={profile.city} onChange={(e)=>setProfile(p=>({...p, city: e.target.value}))} />
                <input className="border rounded px-3 py-2" placeholder="Estado" value={profile.state} onChange={(e)=>setProfile(p=>({...p, state: e.target.value}))} />
                <input className="border rounded px-3 py-2" placeholder="CEP" value={profile.zip_code} onChange={(e)=>setProfile(p=>({...p, zip_code: e.target.value}))} />
              </div>
              <button onClick={saveProfile} disabled={saving} className="mt-2 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">Salvar endereço</button>
            </div>
          </div>

          <div className="bg-white border rounded-lg p-4">
            <h2 className="font-semibold mb-3">Formas de pagamento</h2>
            <div className="space-y-3 text-sm text-gray-700">
              <p className="text-gray-600">Nenhum cartão salvo.</p>
              <button className="inline-flex items-center px-4 py-2 border rounded hover:bg-gray-50">Adicionar cartão</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default AccountPage;
