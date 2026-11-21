import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter
S=1024
def fbm(seed):
    r=np.random.default_rng(seed); out=np.zeros((S,S))
    for s,a in [(64,1),(32,.55),(16,.3),(8,.16),(4,.08)]:
        n=gaussian_filter(r.standard_normal((S,S)),s,mode='wrap'); out+=n/n.std()*a
    return out/out.std()
for name,seed,th in [('fog-a',5,-0.1),('fog-b',9,0.25)]:
    n=fbm(seed)
    a=np.clip((n-th)/1.6,0,1)**1.3
    rgba=np.zeros((S,S,4),np.uint8); rgba[...,:3]=np.array([236,240,238]); rgba[...,3]=(a*235).astype(np.uint8)
    Image.fromarray(rgba).save(f'/home/claude/ags-global-trades/public/story/parts/{name}.webp',quality=70)
