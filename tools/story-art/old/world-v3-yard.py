# Aerial forest world with a road that runs in from the left, turns a corner and heads down the page.
import numpy as np, math, sys
from PIL import Image, ImageFilter
from scipy.ndimage import gaussian_filter, map_coordinates
RS=1.1
WW,WH=3400,3500
W,H=int(WW*RS),int(WH*RS)
YH,R,CX,WR,SH=1250,300,2600,200,34
# yard: concrete apron opening onto the road, warehouse behind it
AP=(520,760,1760,YH-WR/2)   # x0,y0,x1,y1
WHB=(430,430,1010,760)       # warehouse roof
def in_rect(x,y,r,m=0): return r[0]-m<=x<=r[2]+m and r[1]-m<=y<=r[3]+m
rng=np.random.default_rng(11)
def gnoise(s,seed):
    n=gaussian_filter(np.random.default_rng(seed).standard_normal((H,W)).astype(np.float32),s*RS,mode='reflect')
    return n/n.std()
def road_d(x,y):
    """distance to the road centreline and distance along it (world px)"""
    x=np.asarray(x,np.float32); y=np.asarray(y,np.float32)
    ax,ay=CX-R,YH+R
    d=np.empty_like(x); s=np.empty_like(x)
    m1=x<ax; m3=(~m1)&(y>ay); m2=(~m1)&(~m3)
    d[m1]=np.abs(y[m1]-YH); s[m1]=x[m1]
    d[m3]=np.abs(x[m3]-CX); s[m3]=ax+R*math.pi/2+(y[m3]-ay)
    rr=np.hypot(x[m2]-ax,y[m2]-ay); d[m2]=np.abs(rr-R)
    th=np.arctan2(x[m2]-ax,-(y[m2]-ay)); s[m2]=ax+R*np.clip(th,0,math.pi/2)
    return d,s
# crowns
pts=[]; cell=50; grid={}
for t in range(400000):
    r=float(np.clip(rng.lognormal(math.log(38),0.36),16,90))
    x=rng.uniform(-80,WW+80); y=rng.uniform(-80,WH+80)
    d,_=road_d(np.array([x]),np.array([y]))
    if d[0]<WR/2+SH-r*0.45: continue
    if in_rect(x,y,AP,r*0.5) or in_rect(x,y,WHB,r*0.6): continue
    gx,gy=int(x//cell),int(y//cell); bad=False
    for i in range(gx-3,gx+4):
        for j in range(gy-3,gy+4):
            for (px,py,pr) in grid.get((i,j),[]):
                if (px-x)**2+(py-y)**2<((pr+r)*0.55)**2: bad=True;break
            if bad:break
        if bad:break
    if bad: continue
    pts.append((x,y,r)); grid.setdefault((gx,gy),[]).append((x,y,r))
print('crowns',len(pts),flush=True)
hgt=np.full((H,W),-5,np.float32); cid=np.full((H,W),-1,np.int32); kind=[]
f1=gnoise(0.9,21); f2=gnoise(2.0,22); f3=gnoise(4.5,23); f0=gnoise(0.5,24)
for k,(x,y,r) in enumerate(pts):
    con=rng.random()<0.45; kind.append(con)
    top=r*rng.uniform(0.9,1.5)+(10 if con else 0)
    X0,X1=max(0,int((x-r-1)*RS)),min(W,int((x+r+2)*RS)); Y0,Y1=max(0,int((y-r-1)*RS)),min(H,int((y+r+2)*RS))
    if X1<=X0 or Y1<=Y0: continue
    X,Y=np.meshgrid(np.arange(X0,X1),np.arange(Y0,Y1))
    wx,wy=X/RS,Y/RS
    d=np.hypot(wx-x,wy-y)/r; th=np.arctan2(wy-y,wx-x)
    a0,a1,a2,a3=f0[Y,X],f1[Y,X],f2[Y,X],f3[Y,X]
    if con:
        prof=np.clip(1-d,0,1)**0.9
        spikes=0.2*np.cos(th*rng.integers(9,15)+rng.uniform(0,6))*d
        hh=top*(prof+spikes*prof+(a0*0.05+a1*0.09+a2*0.07)*prof)
        edge=d+0.12*np.cos(th*11)+0.06*a2
    else:
        prof=np.sqrt(np.clip(1-d**2,0,1))
        hh=top*(prof*0.75+0.25*prof**3)+top*(a3*0.10+a2*0.12+a1*0.10+a0*0.05)*prof
        edge=d+0.10*a3+0.05*a2
    win=(edge<1)&(hh>hgt[Y,X])
    hgt[Y[win],X[win]]=hh[win]; cid[Y[win],X[win]]=k
yy_,xx_=np.mgrid[0:H,0:W]
bm=(xx_/RS>=WHB[0])&(xx_/RS<=WHB[2])&(yy_/RS>=WHB[1])&(yy_/RS<=WHB[3])
hgt[bm]=70; cid[bm]=-2
del yy_,xx_
print('heights',flush=True)
Lx,Ly,Lz=-0.62,-0.55,0.56
gy,gx=np.gradient(gaussian_filter(hgt,0.7,mode='reflect')/RS)
nl=np.sqrt(gx**2+gy**2+1); nx,ny,nz=-gx/nl,-gy/nl,1/nl
diff=np.clip(nx*Lx+ny*Ly+nz*Lz,0,1)
sh=np.zeros_like(hgt); n=math.hypot(Lx,Ly); dx,dy=-Lx/n,-Ly/n; tanE=Lz/n
YY,XX=np.mgrid[0:H,0:W].astype(np.float32)
for s in range(2,80,2):
    hs=map_coordinates(hgt,[YY-dy*s*RS,XX-dx*s*RS],order=1,mode='nearest')
    np.maximum(sh,np.clip((hs-s*tanE-hgt)/6,0,1),out=sh)
del YY,XX
print('shadows',flush=True)
ao=np.clip((hgt-gaussian_filter(hgt,10*RS,mode='reflect'))/18+0.75,0.25,1.05)
pal_b=np.array([[70,98,42],[82,108,46],[60,88,40],[92,114,52],[56,80,36],[100,118,58]],np.float32)
pal_c=np.array([[34,58,38],[40,64,40],[30,52,36],[46,70,44]],np.float32)
tint=np.array([ (pal_c if c else pal_b)[rng.integers(4 if c else 6)]*rng.uniform(0.85,1.12) for c in kind],np.float32)
col=np.where(cid[...,None]>=0,tint[np.clip(cid,0,None)],np.array([20,30,20],np.float32))
light=(0.34+1.0*diff**1.1)*(1-0.62*sh)*ao
light=np.where(cid>=0,light,0.55*(1-0.4*sh))
img=col*light[...,None]
img+=(np.clip(f0*0.5+0.1,0,None)*diff*(cid>=0))[...,None]*np.array([12,14,7])
# road
yy,xx=np.mgrid[0:H,0:W]; d,sa=road_d(xx/RS,yy/RS); del yy,xx
open_=cid<0
an=gnoise(0.6,31); big=gnoise(30,32); gr=gnoise(0.8,33)
roadm=(d<WR/2)&open_; shm=(d>=WR/2)&(d<WR/2+SH)&open_
# tyre wear: darker bands down each lane
wear=np.exp(-((np.abs(d-WR/4)-14)/8)**2)
base=70+an*7+big*5-wear*7
R_=np.stack([base,base*1.01,base*1.03],-1)
img[roadm]=R_[roadm]*(1-0.55*sh[roadm])[:,None]
G=np.stack([78+gr*18+big*6,74+gr*17+big*6,62+gr*15+big*5],-1)
img[shm]=G[shm]*(1-0.55*sh[shm])[:,None]
m=(np.abs(d-(WR/2-10))<2.0)&open_
img[m]=img[m]*0.35+np.array([205,205,200])*0.65*(1-0.5*sh[m])[:,None]
m=(d<2.8)&((sa%220)<105)&open_
img[m]=np.array([226,226,220])*(1-0.5*sh[m])[:,None]
yy_,xx_=np.mgrid[0:H,0:W]; wx_=xx_/RS; wy_=yy_/RS
apm=(wx_>=AP[0])&(wx_<=AP[2])&(wy_>=AP[1])&(wy_<=AP[3])&(cid==-1)
cn=gnoise(1.0,51); cb=gnoise(18,52)
slab=((np.abs((wx_-AP[0])%160)<1.2)|(np.abs((wy_-AP[1])%160)<1.2))
conc=np.stack([150+cn*7+cb*6,148+cn*7+cb*6,142+cn*6+cb*5],-1)-slab[...,None]*18
stain=np.clip(gnoise(6,53)-1.6,0,None)*25
conc-=stain[...,None]
# yellow bay lines either side of the parking bay
bay=((np.abs(wy_-(AP[3]-150))<2.5)|(np.abs(wy_-(AP[3]-20))<2.5))&(wx_>1150)&(wx_<1470)
conc[bay]=np.array([214,176,60])
img[apm]=conc[apm]*(1-0.55*sh[apm])[:,None]
# corrugated roof, ridge along its length, light from the upper left
rx_=wx_-WHB[0]; ry_=wy_-WHB[1]
rib=0.5+0.5*np.cos(rx_*2*np.pi/9)
side=np.where(ry_<(WHB[3]-WHB[1])/2,1.08,0.86)
roof=np.stack([138+rib*22,141+rib*22,144+rib*22],-1)*side[...,None]
edge=(rx_<5)|(rx_>WHB[2]-WHB[0]-5)|(ry_<5)|(ry_>WHB[3]-WHB[1]-5)
roof[edge]*=0.75
ridge=np.abs(ry_-(WHB[3]-WHB[1])/2)<2
roof[ridge]*=1.12
for (cx_,cy_) in [(560,520),(760,520),(900,680),(620,690)]:
    v=(np.abs(wx_-cx_)<16)&(np.abs(wy_-cy_)<12); roof[v]=np.array([88,92,96])
rm=cid==-2
img[rm]=roof[rm]*(1-0.3*sh[rm])[:,None]
# dock door shadow line on the south face
door=(wx_>760)&(wx_<900)&(wy_>WHB[3])&(wy_<WHB[3]+6)
img[door]=np.array([40,42,44])
del yy_,xx_,wx_,wy_
img=img*np.array([0.95,1.0,0.97])+np.array([4,6,7])
lum=img.mean(-1,keepdims=True); img=lum+(img-lum)*0.95
img+=gnoise(0.4,40)[...,None]*2.5
im=Image.fromarray(np.clip(img,0,255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.35))
im.save('/tmp/rv/gen/world.png')
out='/home/claude/ags-global-trades/public/story/parts/'
im.save(out+'world.webp',quality=76,method=5)
im.resize((W*3//5,H*3//5),Image.LANCZOS).save(out+'world-m.webp',quality=76,method=5)
im.crop((int(300*RS),int(350*RS),int(1900*RS),int(1500*RS))).resize((1600,1150)).save('/tmp/rv/gen/wcrop.jpg',quality=85)
print('done')
