import numpy as np, math
from PIL import Image, ImageFilter
from scipy.ndimage import gaussian_filter, map_coordinates
W,H=1600,2400
rng=np.random.default_rng(11)
RC=W//2; ROAD_W=150; SH=30
def gnoise(s,seed,amp=1):
    n=gaussian_filter(np.random.default_rng(seed).standard_normal((H,W)),s,mode='wrap')
    return n/n.std()*amp
# --- crown placement (grid rejection), wraps vertically
pts=[]; cell=40; grid={}
def near(x,y):
    gx,gy=int(x//cell),int(y//cell)
    for i in range(gx-3,gx+4):
        for j in range(gy-3,gy+4):
            for p in grid.get((i,j%(H//cell)),[]): yield p
for t in range(120000):
    r=float(np.clip(rng.lognormal(math.log(30),0.38),13,70))
    x=rng.uniform(-60,W+60); y=rng.uniform(0,H)
    if abs(x-RC)<ROAD_W/2+SH-r*0.45: continue
    bad=False
    for (px,py,pr) in near(x,y):
        dy=abs(py-y); dy=min(dy,H-dy)
        if (px-x)**2+dy**2<((pr+r)*0.55)**2: bad=True;break
    if bad: continue
    pts.append((x,y,r)); grid.setdefault((int(x//cell),int(y//cell)%(H//cell)),[]).append((x,y,r))
print('crowns',len(pts))
hgt=np.zeros((H,W),np.float32)-5
cid=np.full((H,W),-1,np.int32)
kind=[]
fine1=gnoise(1.2,21); fine2=gnoise(2.6,22); fine3=gnoise(5,23)
for k,(x,y,r) in enumerate(pts):
    con=rng.random()<0.5
    kind.append(con)
    top=r*rng.uniform(0.9,1.5)+(8 if con else 0)
    x0,x1=int(max(0,x-r-1)),int(min(W,x+r+2))
    ys=np.arange(int(y-r-1),int(y+r+2))
    if x1<=x0: continue
    X,Y=np.meshgrid(np.arange(x0,x1),ys)
    d=np.hypot(X-x,Y-y)/r
    th=np.arctan2(Y-y,X-x)
    Yw=Y%H
    if con:
        prof=np.clip(1-d,0,1)**0.9
        spikes=0.18*np.cos(th*rng.integers(9,15)+rng.uniform(0,6))*d
        rough=fine1[Yw,X]*0.10+fine2[Yw,X]*0.08
        hh=top*(prof+spikes*prof+rough*prof)
        edge=d+0.12*np.cos(th*11)+0.06*fine2[Yw,X]
    else:
        prof=np.sqrt(np.clip(1-d**2,0,1))
        rough=fine3[Yw,X]*0.10+fine2[Yw,X]*0.12+fine1[Yw,X]*0.12
        hh=top*(prof*0.75+0.25*prof**3)+top*rough*prof
        edge=d+0.10*fine3[Yw,X]+0.05*fine2[Yw,X]
    inside=edge<1
    cur=hgt[Yw,X]
    win=inside&(hh>cur)
    hgt[Yw[win],X[win]]=hh[win]
    cid[Yw[win],X[win]]=k
# light from upper-left, fairly low sun
Lx,Ly,Lz=-0.62,-0.55,0.56
gy,gx=np.gradient(gaussian_filter(hgt,0.8,mode='wrap'))
nx,ny,nz=-gx,-gy,np.ones_like(gx)*1.0
nl=np.sqrt(nx**2+ny**2+nz**2); nx/=nl;ny/=nl;nz/=nl
diff=np.clip(nx*Lx+ny*Ly+nz*Lz,0,1)
# cast shadows by marching toward the light
sh=np.zeros_like(hgt)
dirx,diry=-Lx,-Ly  # step toward light source position
norm=math.hypot(dirx,diry); dirx/=norm; diry/=norm
tanE=Lz/math.hypot(Lx,Ly)
YY,XX=np.mgrid[0:H,0:W].astype(np.float32)
for s in range(2,70,2):
    hs=map_coordinates(hgt,[ (YY-diry*s)%H, np.clip(XX-dirx*s,0,W-1)],order=1,mode='wrap')
    sh=np.maximum(sh,np.clip((hs-s*tanE-hgt)/6,0,1))
ao=np.clip((hgt-gaussian_filter(hgt,10,mode='wrap'))/18+0.75,0.25,1.05)
# colours
pal_b=np.array([[70,98,42],[82,108,46],[60,88,40],[92,112,52],[56,80,36]],np.float32)
pal_c=np.array([[34,58,38],[40,64,40],[30,52,36],[46,70,44]],np.float32)
tint=np.zeros((len(pts),3),np.float32)
for k,con in enumerate(kind):
    p=pal_c if con else pal_b
    tint[k]=p[rng.integers(len(p))]*rng.uniform(0.85,1.12)
col=np.where(cid[...,None]>=0,tint[np.clip(cid,0,None)],np.array([20,30,20],np.float32))
light=(0.34+1.0*diff**1.1)*(1-0.62*sh)*ao
light=np.where(cid>=0,light,0.55*(1-0.4*sh))
img=col*light[...,None]
# speckle highlights on lit leaves
spk=np.clip(fine1*0.5+0.1,0,None)*diff*(cid>=0)
img+=spk[...,None]*np.array([10,12,6])
# road
xs=np.arange(W)[None,:].repeat(H,0)
sx=np.abs(xs-RC)
an=gnoise(0.7,31); big=gnoise(30,32)
roadm=(sx<ROAD_W/2)&(cid<0)
shm=(sx>=ROAD_W/2)&(sx<ROAD_W/2+SH)&(cid<0)
R=np.stack([70+an*7+big*5]*3,-1)*np.array([1,1.01,1.03])
img[roadm]=R[roadm]*(1-0.55*sh[roadm])[:,None]
gr=gnoise(1.0,33)
G=np.stack([78+gr*18+big*6,74+gr*17+big*6,62+gr*15+big*5],-1)
img[shm]=G[shm]*(1-0.55*sh[shm])[:,None]
for ex in (RC-ROAD_W/2+9,RC+ROAD_W/2-9):
    m=(np.abs(xs-ex)<2.0)&(cid<0)
    img[m]=img[m]*0.35+np.array([205,205,200])*0.65*(1-0.5*sh[m])[:,None]
dash=((np.arange(H)%210)<100)[:,None]&(np.abs(xs-RC)<2.6)&(cid<0)
img[dash]=np.array([228,228,222])*(1-0.5*sh[dash])[:,None]
# grade
img=img*np.array([0.95,1.0,0.97])+np.array([4,6,7])
lum=img.mean(-1,keepdims=True); img=lum+(img-lum)*0.95
img+=gnoise(0.5,40)[...,None]*2.5
im=Image.fromarray(np.clip(img,0,255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.4))
im.save('/tmp/rv/gen/forest.png')
out='/home/claude/ags-global-trades/public/story/parts/'
im.save(out+'forest.webp',quality=84)
im.resize((W*5//8,H*5//8),Image.LANCZOS).save(out+'forest-m.webp',quality=82)
im.crop((300,600,1300,1300)).save('/tmp/rv/gen/crop.jpg',quality=88)
