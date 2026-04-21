import { useCats } from '../context/CatContext';
import { CatAvatar } from './Icons';

export default function CatSelector() {
  const { cats, selectedCatId, setSelectedCatId } = useCats();

  if (cats.length === 0) return <span className="no-cats">No cats yet</span>;

  const selected = cats.find(c => c.id === selectedCatId);

  return (
    <div className="cat-selector-wrapper">
      <CatAvatar
        name={selected?.name || ''}
        size={36}
        avatarColor={selected?.avatar_color}
        avatarEar={selected?.avatar_ear}
        avatarEye={selected?.avatar_eye}
        avatarPattern={selected?.avatar_pattern}
      />
      <select
        className="cat-selector"
        value={selectedCatId || ''}
        onChange={e => setSelectedCatId(Number(e.target.value))}
      >
        {cats.map(cat => (
          <option key={cat.id} value={cat.id}>{cat.name}</option>
        ))}
      </select>
    </div>
  );
}
