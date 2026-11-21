import numpy as np, math, random
from PIL import Image, ImageDraw, ImageFilter
from scipy.ndimage import gaussian_filter
W,H=1600,2400
rng=np.random.default_rng(7); random.seed(7)
ROAD_W=150; RC=W//2; SH=26  # shoulder
def noise(scale,seed):
    r=np.random.default_rng(seed).standard_normal((H//scale+2,W//scale+2))
    r=np.tile(r,(1,1))
    img=Image.fromarray(((r-r.min())/(r.max()-r.min())*255).astype(np.uint8)).resize((W,H+scale*2),Image.BICUBIC)
    a=np.asarray(img,np.float32)[:H]/255
    return a
# ground (dark understory)
base=np.zeros((H,W,3),np.float32)
n1=gaussian_filter(rng.standard_normal((H,W)),6,mode='wrap'); n1/=n1.std()
base[:]=np.array([20,32,20])/255
base+= (n1[...,None]*np.array([6,9,5])/255)
img=Image.fromarray((np.clip(base,0,1)*255).astype(np.uint8))
shadow=Image.new('L',(W,H),0); sd=ImageDraw.Draw(shadow)
crowns=Image.new('RGBA',(W,H),(0,0,0,0)); cd=ImageDraw.Draw(crowns)
# crown placement avoiding road corridor
pts=[]
grid={}
def ok(x,y,r):
    for (px,py,pr) in pts[-400:]:
        dy=min(abs(py-y),H-abs(py-y))
        if (px-x)**2+dy**2 < ((pr+r)*0.62)**2: return False
    return True
tries=0
while tries<60000:
    tries+=1
    r=float(np.clip(rng.lognormal(math.log(34),0.35),14,80))
    x=rng.uniform(-40,W+40); y=rng.uniform(0,H)
    edge=ROAD_W/2+SH+r*0.35
    if abs(x-RC)<edge: continue
    pts.append((x,y,r))
pts.sort(key=lambda p:p[2])
L=np.array([-0.55,-0.6,0.58]); L/=np.linalg.norm(L)
def dup(y,r):
    ys=[y]
    if y-r*1.6<0: ys.append(y+H)
    if y+r*1.6>H: ys.append(y-H)
    return ys
for (x,y,r) in pts:
    for yy in dup(y,r):
        sd.ellipse([x-r+r*0.35,yy-r+r*0.45,x+r+r*0.35,yy+r+r*0.45],fill=200)
conifer_hue=[(28,58,34),(24,52,36),(34,66,38)]
broad_hue=[(52,92,36),(62,104,40),(44,84,34),(74,112,44),(40,74,30)]
for (x,y,r) in pts:
    con = rng.random()<0.45
    pal = conifer_hue if con else broad_hue
    c0=np.array(pal[rng.integers(len(pal))],np.float32)*rng.uniform(0.85,1.15)
    nb=int(r*r/ (9 if con else 14))+20
    for yy in dup(y,r):
        # dark base disk
        cd.ellipse([x-r,yy-r,x+r,yy+r],fill=tuple(int(v*0.45) for v in c0)+(255,))
        for k in range(nb):
            if con:
                a=rng.uniform(0,2*math.pi); d=r*math.sqrt(rng.random())
                br=max(1.5,(r-d)*0.12+rng.uniform(1,3))
                bx=x+math.cos(a)*d; by=yy+math.sin(a)*d
                # radial needles: elongated small blobs
                nx,ny=math.cos(a)*d/r,math.sin(a)*d/r
            else:
                a=rng.uniform(0,2*math.pi); d=r*math.sqrt(rng.random())*0.95
                br=rng.uniform(r*0.12,r*0.28)
                bx=x+math.cos(a)*d; by=yy+math.sin(a)*d
                nx,ny=(bx-x)/r,(by-yy)/r
            nz=math.sqrt(max(0.05,1-nx*nx-ny*ny))
            lit=max(0.0,nx*L[0]+ny*L[1]+nz*L[2])
            shade=0.35+0.95*lit**1.3
            col=np.clip(c0*shade*rng.uniform(0.85,1.12),0,255)
            if lit>0.85 and not con: col=np.clip(col+np.array([14,16,6]),0,255)
            cd.ellipse([bx-br,by-br,bx+br,by+br],fill=tuple(int(v) for v in col)+(255,))
sh=np.asarray(shadow.filter(ImageFilter.GaussianBlur(9)),np.float32)/255
g=np.asarray(img,np.float32)*(1-0.55*sh[...,None])
img=Image.fromarray(g.astype(np.uint8))
# road
road=np.asarray(img,np.float32).copy()
xs=np.arange(W)
an=gaussian_filter(np.random.default_rng(3).standard_normal((H,W)),0.7,mode='wrap')
big=gaussian_filter(np.random.default_rng(4).standard_normal((H,W)),25,mode='wrap'); big/=big.std()
sx=np.abs(xs-RC)
roadmask=(sx<ROAD_W/2)
shoulder=(sx>=ROAD_W/2)&(sx<ROAD_W/2+SH)
asph=np.array([62,63,64],np.float32)
R=asph[None,None,:]+an[...,None]*9+big[...,None]*5
road[:,roadmask]=R[:,roadmask]
gn=gaussian_filter(np.random.default_rng(5).standard_normal((H,W)),1.2,mode='wrap')
grav=np.array([92,86,72],np.float32)[None,None,:]+gn[...,None]*22+big[...,None]*8
road[:,shoulder]=grav[:,shoulder]*0.8
# edge lines + dashes
for ex in (RC-ROAD_W/2+8, RC+ROAD_W/2-8):
    m=np.abs(xs-ex)<2.2
    road[:,m]=road[:,m]*0.4+np.array([200,200,196])*0.6
dash=(np.arange(H)%200)<96
m=np.abs(xs-RC)<3
road[np.ix_(dash,m)]=np.array([225,224,218])
img=Image.fromarray(np.clip(road,0,255).astype(np.uint8))
# overhanging crowns over shoulders
img.paste(crowns,(0,0),crowns)
a=np.asarray(img,np.float32)
fine=gaussian_filter(np.random.default_rng(9).standard_normal((H,W)),0.6,mode='wrap')
a+=fine[...,None]*5
# grade: slightly cooler, lifted shadows
a=a*np.array([0.96,1.0,0.98])+np.array([3,5,6])
img=Image.fromarray(np.clip(a,0,255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.5))
img.save('/tmp/rv/gen/forest.png')
img.save('/home/claude/ags-global-trades/public/story/parts/forest.webp',quality=82)
img.resize((W//2,H//2),Image.LANCZOS).save('/home/claude/ags-global-trades/public/story/parts/forest-m.webp',quality=80)
img.crop((300,600,1300,1300)).save('/tmp/rv/gen/crop.jpg',quality=85)
print(len(pts))
