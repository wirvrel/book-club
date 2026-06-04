import { Form, useNavigate } from 'react-router-dom';
import { useGetMeQuery } from '../features/auth/authApi';
import { useUpdateProfileMutation, useUploadAvatarMutation } from '../features/users/usersApi';
import { getImageUrl } from '../utils/getImageUrl';
import { TextField } from '../components/ui/TextField';
import { Button } from '../components/ui/Button';
import { Camera } from 'lucide-react';
import { useState, useRef } from 'react';
import styles from './EditProfile.module.css';

export const EditProfilePage = () => {
  const { data: userData } = useGetMeQuery(undefined);
  const [updateProfile, { isLoading: isUpdating }] = useUpdateProfileMutation();
  const [uploadAvatar, { isLoading: isUploading }] = useUploadAvatarMutation();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const user = userData?.data;

  if (!user) return <div>Потрібно увійти в систему</div>;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const file = fileInputRef.current?.files?.[0];
    
    try {
      if (file) {
        await uploadAvatar({ id: user.id, file }).unwrap();
      }

      await updateProfile({
        id: user.id,
        username: formData.get('username') as string,
        bio: formData.get('bio') as string,
        location: formData.get('location') as string,
        birthday: formData.get('birthday') as string || undefined,
      }).unwrap();

      navigate('/profile');
    } catch (err) {
      alert('Помилка при збереженні профілю');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1>Редагування профілю</h1>
        
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.avatarSection}>
            <div className={styles.avatarPreview}>
              <img src={previewUrl || getImageUrl(user.profilePicture, 'user')} alt="" />
              <button 
                type="button" 
                className={styles.uploadBtn} 
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                <Camera size={20} />
              </button>
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="image/*" 
              style={{ display: 'none' }} 
            />
            <p className={styles.helpText}>Натисніть на іконку, щоб змінити фото</p>
          </div>

          <TextField
            label="Ім'я користувача"
            name="username"
            defaultValue={user.username}
            isRequired
          />
          
          <TextField
            label="Про себе"
            name="bio"
            defaultValue={user.bio || ''}
            multiline
            placeholder="Розкажіть про свої літературні вподобання..."
          />

          <TextField
            label="Місце знаходження"
            name="location"
            defaultValue={user.location || ''}
            placeholder="Наприклад: Київ, Україна"
          />

          <TextField
            label="Дата народження"
            name="birthday"
            type="date"
            defaultValue={user.birthday ? new Date(user.birthday).toISOString().split('T')[0] : ''}
          />

          <div className={styles.actions}>
            <Button type="button" variant="outline" onPress={() => navigate('/profile')}>
              Скасувати
            </Button>
            <Button type="submit" isLoading={isUpdating || isUploading}>
              Зберегти всі зміни
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
