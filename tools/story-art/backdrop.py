import numpy as np, math
from PIL import Image, ImageDraw, ImageFilter
from scipy.ndimage import gaussian_filter
out='/home/claude/ags-global-trades/public/story/parts/'
W,H=2400,800   # one horizontally tiling strip; trees stand on the bottom edge
def pine(d,x,base,h,col,rng):
    w=h*rng.uniform(0.28,0.38)
    tiers=int(rng.integers(9,15))
    th=h/tiers
    for i in range(tiers):
        t=i/tiers
        yb=base-h*t*0.92
        half=w*0.5*(1-t)**1.1*rng.uniform(0.85,1.1)
        pts=[(x,yb-th*1.9)]
        # drooping branch tips along each side
        k=5
        for j in range(k+1):
            f=j/k
            pts.append((x+half*f, yb-th*1.9*(1-f)+th*0.25*np.sin(f*np.pi)+rng.uniform(-2,2)))
        for j in range(k,-1,-1):
            f=j/k
            pts.append((x-half*f, yb-th*1.9*(1-f)+th*0.25*np.sin(f*np.pi)+rng.uniform(-2,2)))
        for dx in (-W,0,W): d.polygon([(px+dx,py) for px,py in pts],fill=col)
    for dx in (-W,0,W): d.polygon([(x-1+dx,base-h),(x+1+dx,base-h),(x+dx,base-h*1.04)],fill=col)
def layer(seed,n,hmin,hmax,col,blur,mist,name,density_dense=0.0):
    rng=np.random.default_rng(seed)
    sup=2; im=Image.new('L',(W*sup,H*sup),0); d=ImageDraw.Draw(im)
    xs=np.sort(rng.uniform(0,W,n))
    for x in xs:
        h=rng.uniform(hmin,hmax)*sup
        pine(d,x*sup,H*sup+rng.uniform(0,30)*sup,h,255,rng)
    # ground mass so the base reads solid
    d.rectangle([0,(H-hmin*0.12)*sup,W*sup,H*sup],fill=255)
    a=np.asarray(im.resize((W,H),Image.LANCZOS),np.float32)/255
    if blur: a=gaussian_filter(a,blur,mode='wrap')
    # texture inside the silhouette, lighter tops
    tex=gaussian_filter(np.random.default_rng(seed+1).standard_normal((H,W)),1.2,mode='wrap')
    y=np.linspace(0,1,H)[:,None]
    rgb=np.array(col,np.float32)[None,None,:]*(1+tex[...,None]*0.05)
    # mist pooling at the tree bases: blend toward the fog colour near the bottom
    fogc=np.array([228,233,231],np.float32)
    m=np.clip((y-(1-mist))/mist,0,1)**1.4*0.85 if mist>0 else np.zeros_like(y)
    rgb=rgb*(1-m[...,None])+fogc*m[...,None]
    rgba=np.dstack([np.clip(rgb,0,255),np.clip(a*255,0,255)]).astype(np.uint8)
    Image.fromarray(rgba,'RGBA').save(out+name+'.webp',quality=82)
    return rgba
far=layer(1,110,150,290,(182,196,192),2.0,0.6,'tree-far')
mid=layer(2,46,240,430,(124,146,136),1.0,0.55,'tree-mid')
near=layer(3,16,380,600,(56,74,66),0.5,0.45,'tree-near')
# preview composite
sky=np.zeros((H,W,3),np.float32); y=np.linspace(0,1,H)[:,None]
sky[:]=(np.array([222,228,228])*(1-y[...,None])+np.array([240,242,240])*y[...,None])
img=Image.fromarray(sky.astype(np.uint8)).convert('RGBA')
for L in (far,mid,near): img.alpha_composite(Image.fromarray(L,'RGBA'))
img.convert('RGB').resize((1200,400)).save('/tmp/rv/gen/backdrop.jpg',quality=85)
# road surface strip seen from the side: asphalt, lighter toward the horizon, gravel edge on top
GW,GH=1200,300
rng=np.random.default_rng(9)
n=gaussian_filter(rng.standard_normal((GH,GW)),0.8,mode='wrap'); b=gaussian_filter(rng.standard_normal((GH,GW)),14,mode='wrap'); b/=b.std()
yy=np.linspace(0,1,GH)[:,None]
v=58+n*8+b*1.5-yy*14
g=np.dstack([v,v*1.01,v*1.04])
edge=yy<0.07
gr=gaussian_filter(rng.standard_normal((GH,GW)),0.6,mode='wrap')
gcol=np.dstack([96+gr*24,90+gr*22,76+gr*20])
g=np.where(edge[...,None].repeat(GW,1),gcol,g)
Image.fromarray(np.clip(g,0,255).astype(np.uint8)).save(out+'ground-side.webp',quality=82)
print('ok')
