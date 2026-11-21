from PIL import Image, ImageDraw, ImageFilter
import numpy as np
S=8  # supersample: 1 world px = S px, then downsample to 3x world
def finish(im,w,h,name):
    im=im.resize((w*3,h*3),Image.LANCZOS); im.save(f'/home/claude/ags-global-trades/public/story/parts/{name}.webp',quality=92); im.save(f'/tmp/rv/gen/{name}.png')
# Forklift, heading south (forks at the bottom). World size 40 x 124 (body 80 + forks 44)
W,H=40,124
im=Image.new('RGBA',(W*S,H*S),(0,0,0,0)); d=ImageDraw.Draw(im)
def R(x0,y0,x1,y1,fill,r=0,outline=None,w=0): d.rounded_rectangle([x0*S,y0*S,x1*S,y1*S],radius=r*S,fill=fill,outline=outline,width=int(w*S))
# forks (under everything else)
R(8,74,13,123,(122,124,128,255),1); R(27,74,32,123,(122,124,128,255),1)
R(8,74,13,123,None,1,(70,72,76,255),0.6); R(27,74,32,123,None,1,(70,72,76,255),0.6)
# mast + carriage
R(3,70,37,79,(46,48,52,255),1.5); R(5,72,35,77,(70,72,76,255),1)
# body
R(1,8,39,72,(232,164,28,255),6)
R(3,10,37,70,(244,180,44,255),5)
# counterweight (rear, top)
R(2,0,38,20,(54,56,60,255),8); R(4,2,36,16,(70,72,78,255),6)
# wheels peeking out
for (x0,y0) in [(-1,14),(37,14),(-1,54),(37,54)]: R(x0,y0,x0+4,y0+12,(28,28,30,255),1.5)
# overhead guard: frame with slats
R(4,28,36,66,None,2,(30,31,34,255),2.2)
for y in range(33,64,5): R(5,y,35,y+1.4,(36,37,40,255),0.6)
# seat glimpsed through + steering
R(12,36,28,50,(22,22,24,255),3)
d.ellipse([16*S,52*S,24*S,60*S],outline=(20,20,22,255),width=int(1.2*S))
# warning light
d.ellipse([18*S,22*S,22*S,26*S],fill=(255,140,40,255))
im=im.filter(ImageFilter.GaussianBlur(S*0.25))
finish(im,W,H,'fork-top')
# Wooden crate on a pallet, 46 x 40
W,H=46,40
im=Image.new('RGBA',(W*S,H*S),(0,0,0,0)); d=ImageDraw.Draw(im)
R(0,0,46,40,(120,92,58,255),1.5)   # pallet edge
R(2,2,44,38,(186,146,96,255),1)
rng=np.random.default_rng(3)
for i,y in enumerate(range(2,38,6)):
    c=tuple(int(v) for v in np.array([192,152,100])*rng.uniform(0.9,1.06))+(255,)
    R(2.5,y+0.5,43.5,y+5.5,c,0.6)
    d.line([2.5*S,(y+5.7)*S,43.5*S,(y+5.7)*S],fill=(110,82,50,255),width=int(0.7*S))
for x in (12,34): R(x-1.3,1,x+1.3,39,(60,62,66,255),0.4)   # steel straps
R(2,2,44,38,None,1,(96,70,42,255),1.2)
im=im.filter(ImageFilter.GaussianBlur(S*0.25))
finish(im,W,H,'crate-top')
print('ok')
