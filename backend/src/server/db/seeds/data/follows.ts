export const followsData = [
    { followerKey: 'oksana_k', followedKey: 'yulia_t' },
  { followerKey: 'oksana_k', followedKey: 'andriy_m' },
  { followerKey: 'oksana_k', followedKey: 'maria_s' },
  { followerKey: 'oksana_k', followedKey: 'oleh_k' },

    { followerKey: 'andriy_m', followedKey: 'oksana_k' },
  { followerKey: 'andriy_m', followedKey: 'dmytro_l' },
  { followerKey: 'andriy_m', followedKey: 'oleh_k' },

    { followerKey: 'maria_s', followedKey: 'oksana_k' },
  { followerKey: 'maria_s', followedKey: 'vasyl_r' },
  { followerKey: 'maria_s', followedKey: 'iryna_p' },

    { followerKey: 'natalia_h', followedKey: 'yulia_t' },
  { followerKey: 'iryna_p', followedKey: 'yulia_t' },
  { followerKey: 'dmytro_l', followedKey: 'yulia_t' },

    { followerKey: 'oleh_k', followedKey: 'maria_s' },
  { followerKey: 'oleh_k', followedKey: 'andriy_m' },
  { followerKey: 'oleh_k', followedKey: 'oksana_k' },

    { followerKey: 'vasyl_r', followedKey: 'maria_s' },
  { followerKey: 'vasyl_r', followedKey: 'taras_b' },

    { followerKey: 'iryna_p', followedKey: 'oksana_k' },
  { followerKey: 'dmytro_l', followedKey: 'andriy_m' },
];

export interface FollowSeedEntry {
  followerKey: string;
  followedKey: string;
}
