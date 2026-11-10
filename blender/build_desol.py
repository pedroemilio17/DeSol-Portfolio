"""
DeSol — constrói o módulo e a ilha no Blender (docs/04_BLENDER_3D.md).

Rode dentro do Blender:  exec(open(".../blender/build_desol.py").read())
Depois chame build_all() e export_all(). Tudo é regenerável: as coleções
DS_Module e IS_Island são recriadas a cada execução.

As dimensões são escritas no sistema do site (three.js: X direita, Y cima,
Z para a câmera) e convertidas para o Blender (Z cima) por T().
"""
import bpy, bmesh, json, math, os
from mathutils import Vector, Matrix, Euler

ROOT = "/home/peeddrroolg/Área de trabalho/Projetos/DeSol"
RAD = math.radians

PALETTE = {
    "M_sun": "#FFF23F", "M_ink": "#0E0F0C", "M_paper": "#F5F1E6", "M_paper2": "#E3DCC8",
    "M_water": "#1EC8E6", "M_brine": "#FF5A36", "M_leaf": "#2FBF71", "M_leafDark": "#22A862",
    "M_grass": "#3FBF6E", "M_cerrado": "#C98B4A", "M_cerradoDark": "#A66A36", "M_wood": "#B07A4F",
    "M_eps": "#E8E4DA", "M_alu": "#9AA3A8", "M_steel": "#C9D1D6", "M_road": "#EBD3A4",
    "M_table": "#DDCDAA", "M_glass": "#CFF3F8", "M_sunSoft": "#FFF23F",
}
SPEC = {
    "M_sun": dict(emit=4.0), "M_ink": dict(rough=0.85), "M_water": dict(rough=0.08, alpha=0.9),
    "M_alu": dict(metal=1.0, rough=0.35), "M_steel": dict(metal=1.0, rough=0.2),
    "M_glass": dict(rough=0.05, alpha=0.26), "M_sunSoft": dict(emit=0.3, rough=0.5),
    "M_brine": dict(rough=0.3),
}


def lin(hexc):
    h = hexc.lstrip("#")
    def f(c):
        c = int(c, 16) / 255
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    return (f(h[0:2]), f(h[2:4]), f(h[4:6]), 1.0)


def mat(name):
    m = bpy.data.materials.get(name)
    if m is None:
        m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = next(n for n in m.node_tree.nodes if n.type == "BSDF_PRINCIPLED")
    s = SPEC.get(name, {})
    col = lin(PALETTE[name])
    b.inputs["Base Color"].default_value = col
    b.inputs["Roughness"].default_value = s.get("rough", 0.62)
    b.inputs["Metallic"].default_value = s.get("metal", 0.0)
    if "emit" in s:
        b.inputs["Emission Color"].default_value = col
        b.inputs["Emission Strength"].default_value = s["emit"]
    if "alpha" in s:
        b.inputs["Alpha"].default_value = s["alpha"]
        m.surface_render_method = "BLENDED"
    m.diffuse_color = col
    return m


def T(x, y, z):
    """three.js (x, y, z) -> Blender (x, -z, y)."""
    return Vector((x, -z, y))


def collection(name):
    c = bpy.data.collections.get(name)
    if c:
        for o in list(c.objects):
            bpy.data.objects.remove(o, do_unlink=True)
    else:
        c = bpy.data.collections.new(name)
        bpy.context.scene.collection.children.link(c)
    return c


class Part:
    """Acumula primitivas (com material por face) e vira um objeto nomeado."""

    def __init__(self, name, coll):
        self.name, self.coll = name, coll
        self.bm = bmesh.new()
        self.mats = []

    def _mi(self, m):
        if m not in self.mats:
            self.mats.append(m)
        return self.mats.index(m)

    def _merge(self, tmp, m, loc=None, rot=None):
        mi = self._mi(m)
        for f in tmp.faces:
            f.material_index = mi
        if rot is not None:
            bmesh.ops.rotate(tmp, verts=tmp.verts, cent=(0, 0, 0), matrix=Euler(rot).to_matrix())
        if loc is not None:
            bmesh.ops.translate(tmp, verts=tmp.verts, vec=loc)
        me = bpy.data.meshes.new("_tmp")
        tmp.to_mesh(me)
        tmp.free()
        self.bm.from_mesh(me)
        bpy.data.meshes.remove(me)

    @staticmethod
    def _bevel(bm, edges, b, seg):
        if b > 0 and edges:
            bmesh.ops.bevel(bm, geom=edges, offset=b, offset_type="OFFSET", segments=seg, profile=0.5, affect="EDGES", clamp_overlap=True)

    def box(self, size, pos, m, b=0.006, seg=3, rot=None):
        """size=(largura X, altura Y, profundidade Z) e pos no sistema three."""
        w, h, d = size
        tmp = bmesh.new()
        bmesh.ops.create_cube(tmp, size=1.0)
        bmesh.ops.scale(tmp, verts=tmp.verts, vec=(w, d, h))
        self._bevel(tmp, tmp.edges[:], min(b, 0.45 * min(w, h, d)), seg)
        self._merge(tmp, m, T(*pos), rot)
        return self

    def cyl(self, r, h, pos, m, r2=None, seg=28, axis="y", b=0.0, bseg=2, rot=None):
        tmp = bmesh.new()
        bmesh.ops.create_cone(tmp, cap_ends=True, cap_tris=False, segments=seg, radius1=r, radius2=r if r2 is None else r2, depth=h)
        if b > 0:
            rim = [e for e in tmp.edges if len(e.link_faces) == 2 and e.calc_face_angle(0) > RAD(50)]
            self._bevel(tmp, rim, min(b, 0.45 * min(r, h)), bseg)
        base = {"y": None, "z": (RAD(90), 0, 0), "x": (0, RAD(90), 0)}[axis]
        if base:
            bmesh.ops.rotate(tmp, verts=tmp.verts, cent=(0, 0, 0), matrix=Euler(base).to_matrix())
        self._merge(tmp, m, T(*pos), rot)
        return self

    def ball(self, r, pos, m, sub=2, scale=(1, 1, 1)):
        tmp = bmesh.new()
        bmesh.ops.create_icosphere(tmp, subdivisions=sub, radius=r)
        bmesh.ops.scale(tmp, verts=tmp.verts, vec=(scale[0], scale[2], scale[1]))
        self._merge(tmp, m, T(*pos))
        return self

    def torus(self, R, r, pos, m, axis="z", seg=20, rseg=8):
        """Anel; axis = eixo three perpendicular ao plano do anel."""
        tmp = bmesh.new()
        ring = []
        for i in range(seg):
            a = 2 * math.pi * i / seg
            row = []
            for j in range(rseg):
                t = 2 * math.pi * j / rseg
                row.append(tmp.verts.new(((R + r * math.cos(t)) * math.cos(a), (R + r * math.cos(t)) * math.sin(a), r * math.sin(t))))
            ring.append(row)
        for i in range(seg):
            for j in range(rseg):
                tmp.faces.new((ring[i][j], ring[(i + 1) % seg][j], ring[(i + 1) % seg][(j + 1) % rseg], ring[i][(j + 1) % rseg]))
        base = {"y": None, "z": (RAD(90), 0, 0), "x": (0, RAD(90), 0)}[axis]
        if base:
            bmesh.ops.rotate(tmp, verts=tmp.verts, cent=(0, 0, 0), matrix=Euler(base).to_matrix())
        self._merge(tmp, m, T(*pos))
        return self

    def prism_x(self, prof, x0, x1, m, b=0.0, seg=2):
        """Perfil [(z, y)...] no plano lateral, extrudado ao longo de X (three)."""
        tmp = bmesh.new()
        a = [tmp.verts.new(T(x0, y, z)) for z, y in prof]
        c = [tmp.verts.new(T(x1, y, z)) for z, y in prof]
        n = len(prof)
        tmp.faces.new(a)
        tmp.faces.new(list(reversed(c)))
        for i in range(n):
            tmp.faces.new((a[i], c[i], c[(i + 1) % n], a[(i + 1) % n]))
        bmesh.ops.recalc_face_normals(tmp, faces=tmp.faces)
        self._bevel(tmp, tmp.edges[:], b, seg)
        self._merge(tmp, m)
        return self

    def slab(self, outline, y_top, y_bot, m, b=0.1, seg=3):
        """Laje a partir de um contorno [(x, z)...] (three)."""
        tmp = bmesh.new()
        top = [tmp.verts.new(T(x, y_top, z)) for x, z in outline]
        bot = [tmp.verts.new(T(x, y_bot, z)) for x, z in outline]
        n = len(outline)
        tmp.faces.new(top)
        tmp.faces.new(list(reversed(bot)))
        for i in range(n):
            tmp.faces.new((top[i], bot[i], bot[(i + 1) % n], top[(i + 1) % n]))
        bmesh.ops.recalc_face_normals(tmp, faces=tmp.faces)
        rim = [e for e in tmp.edges if abs(e.verts[0].co.z - e.verts[1].co.z) < 1e-6]
        self._bevel(tmp, rim, b, seg)
        self._merge(tmp, m)
        return self

    def raw(self, verts, faces, m):
        tmp = bmesh.new()
        vs = [tmp.verts.new(T(*v)) for v in verts]
        for f in faces:
            tmp.faces.new([vs[i] for i in f])
        bmesh.ops.recalc_face_normals(tmp, faces=tmp.faces)
        self._merge(tmp, m)
        return self

    def finish(self, origin=None, loc=None, rot_z=0.0, parent=None, sharp=40, scale=1.0):
        """origin: ponto (three) que vira a origem do objeto; None = centro da caixa."""
        bm = self.bm
        bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
        if origin is None:
            cs = [v.co for v in bm.verts]
            o = Vector(tuple((min(c[i] for c in cs) + max(c[i] for c in cs)) / 2 for i in range(3)))
        else:
            o = T(*origin)
        bmesh.ops.translate(bm, verts=bm.verts, vec=-o)
        for f in bm.faces:
            f.smooth = True
        for e in bm.edges:
            e.smooth = not (len(e.link_faces) == 2 and e.calc_face_angle(0) > RAD(sharp))
        me = bpy.data.meshes.new(self.name)
        bm.to_mesh(me)
        bm.free()
        for m in self.mats:
            me.materials.append(mat(m))
        ob = bpy.data.objects.new(self.name, me)
        self.coll.objects.link(ob)
        ob.location = o if loc is None else T(*loc)
        ob.rotation_euler = (0, 0, rot_z)
        ob.scale = (scale, scale, scale)
        if parent is not None:
            ob.parent = parent
        return ob


def empty(name, coll, pos):
    e = bpy.data.objects.new(name, None)
    e.empty_display_size = 0.3
    e.location = T(*pos)
    coll.objects.link(e)
    return e


# ---------------------------------------------------------------- módulo
L, D, HF = 1.14, 0.64, 0.15
TAN = math.tan(RAD(18))
HB = HF + TAN * D
Y0, TW, E = 0.05, 0.02, 0.04
YB = Y0 + TW + E


def build_module():
    c = collection("DS_Module")
    P = lambda n: Part(n, c)
    xs, xi, zg = L / 2 - TW / 2, L / 2 - TW - E / 2, D / 2 - TW - E / 2

    legs = P("DS_Legs")
    for sx in (-1, 1):
        for sz in (-1, 1):
            legs.box((0.085, Y0 + 0.012, 0.085), (sx * 0.47, Y0 / 2 + 0.006, sz * 0.23), "M_wood", b=0.014)
            legs.box((0.09, 0.012, 0.09), (sx * 0.47, 0.006, sz * 0.23), "M_ink", b=0.005)
    legs.finish()

    fr = P("DS_Frame")
    fr.box((L, TW, D), (0, Y0 + TW / 2, 0), "M_wood", b=0.008)
    fr.box((L, HF, TW), (0, Y0 + HF / 2, D / 2 - TW / 2), "M_wood", b=0.007)
    fr.box((L, HB, TW), (0, Y0 + HB / 2, -D / 2 + TW / 2), "M_wood", b=0.007)
    side = [(D / 2, Y0), (-D / 2, Y0), (-D / 2, Y0 + HB), (D / 2, Y0 + HF)]
    for sx in (-1, 1):
        fr.prism_x(side, sx * xs - TW / 2, sx * xs + TW / 2, "M_wood", b=0.006)
    # friso de vedação escuro sob o vidro, nas bordas baixa e alta
    fr.box((L - 0.02, 0.008, TW + 0.004), (0, Y0 + HF + 0.001, D / 2 - TW / 2), "M_ink", b=0.003)
    fr.box((L - 0.02, 0.008, TW + 0.004), (0, Y0 + HB + 0.001, -D / 2 + TW / 2), "M_ink", b=0.003)
    fr.finish()

    ins = P("DS_Insulation")
    ins.box((L - 2 * TW, E, D - 2 * TW), (0, Y0 + TW + E / 2, 0), "M_eps", b=0.006)
    ins.box((L - 2 * TW, 0.085, E), (0, Y0 + TW + 0.0425, zg), "M_eps", b=0.006)
    hb = HB - TW - 0.03
    ins.box((L - 2 * TW, hb, E), (0, Y0 + TW + hb / 2, -zg), "M_eps", b=0.006)
    d2 = D - 2 * TW
    prof = [(d2 / 2, Y0 + TW), (-d2 / 2, Y0 + TW), (-d2 / 2, Y0 + TW + HB - TW - 0.02), (d2 / 2, Y0 + TW + HF - TW - 0.02)]
    for sx in (-1, 1):
        ins.prism_x(prof, sx * xi - E / 2, sx * xi + E / 2, "M_eps", b=0.005)
    ins.finish()

    ba = P("DS_Basin")
    ba.box((1.0, 0.006, 0.5), (0, YB + 0.003, 0), "M_ink", b=0.002)
    for sz in (-1, 1):
        ba.box((1.0, 0.045, 0.008), (0, YB + 0.0225, sz * 0.246), "M_ink", b=0.003)
    for sx in (-1, 1):
        ba.box((0.008, 0.045, 0.5), (sx * 0.496, YB + 0.0225, 0), "M_ink", b=0.003)
    ba.finish()

    P("DS_Water_Brine").box((0.982, 0.018, 0.482), (0, YB + 0.015, 0), "M_brine", b=0.003).finish(origin=(0, YB + 0.006, 0))

    st = P("DS_Sensor_Temp")
    st.cyl(0.006, 0.11, (-0.18, YB + 0.06, -0.12), "M_alu", seg=10)
    st.cyl(0.011, 0.012, (-0.18, YB + 0.008, -0.12), "M_alu", seg=12)
    st.ball(0.016, (-0.18, YB + 0.125, -0.12), "M_sun")
    st.finish()

    gu = P("DS_Gutter")
    gu.box((1.02, 0.005, 0.03), (0, 0.158, zg), "M_steel", b=0.002)
    for s in (-1, 1):
        gu.box((1.02, 0.022, 0.005), (0, 0.169, zg + s * 0.0125), "M_steel", b=0.002)
    for s in (-1, 1):
        gu.box((0.005, 0.022, 0.03), (s * 0.51, 0.169, zg), "M_steel", b=0.002)
    g = gu.finish()
    g.rotation_euler = (0, RAD(0.57), 0)  # declive de 1%

    slope = math.atan(TAN)
    gl = P("DS_Glass")
    gl.box((L + 0.03, 0.01, D / math.cos(slope) + 0.03), (0, 0, 0), "M_glass", b=0.004)
    glass = gl.finish(origin=(0, 0, 0), loc=(0, Y0 + (HF + HB) / 2 + 0.006, 0))
    glass.rotation_euler = (slope, 0, 0)
    drops = [(-0.46 + ((k * 0.61) % 1) * 0.52, -0.26 + ((k * 0.37 + 0.13) % 1) * 0.36) for k in range(9)]
    for i, (dx, dz) in enumerate(drops):
        d = Part("DS_Drop_%02d" % (i + 1), c).ball(0.02, (0, 0, 0), "M_water", sub=2).finish(origin=(0, 0, 0), parent=glass)
        d.location = T(dx, -0.014, dz)

    P("DS_Outlet").cyl(0.009, 0.16, (-0.3, 0.165, D / 2 + 0.05), "M_steel", seg=14, axis="z").finish()

    mi = P("DS_Mineralizer")
    mi.cyl(0.034, 0.23, (-0.3, 0.125, D / 2 + 0.13), "M_paper", b=0.008, bseg=3)
    mi.cyl(0.0365, 0.05, (-0.3, 0.13, D / 2 + 0.13), "M_leaf", b=0.004)
    mi.cyl(0.02, 0.014, (-0.3, 0.245, D / 2 + 0.13), "M_steel", b=0.003)
    mi.cyl(0.007, 0.2, (-0.4, 0.03, D / 2 + 0.13), "M_steel", seg=12, axis="x")
    mi.finish()

    co = P("DS_Collector")
    co.box((0.18, 0.25, 0.18), (-0.5, 0.125, D / 2 + 0.14), "M_glass", b=0.022)
    co.box((0.19, 0.016, 0.19), (-0.5, 0.008, D / 2 + 0.14), "M_paper", b=0.006)
    co.box((0.19, 0.012, 0.19), (-0.5, 0.252, D / 2 + 0.14), "M_paper", b=0.005)
    co.finish()

    P("DS_Water_Fresh").box((0.155, 0.22, 0.155), (-0.5, 0.128, D / 2 + 0.14), "M_water", b=0.012).finish(origin=(-0.5, 0.018, D / 2 + 0.14))

    sl = P("DS_Sensor_Level")
    sl.box((0.08, 0.03, 0.05), (-0.5, 0.273, D / 2 + 0.14), "M_paper", b=0.008)
    sl.ball(0.009, (-0.5, 0.292, D / 2 + 0.14), "M_sun", sub=1)
    sl.finish()

    td = P("DS_Sensor_TDS")
    td.cyl(0.006, 0.17, (-0.45, 0.185, D / 2 + 0.19), "M_alu", seg=10)
    td.ball(0.011, (-0.45, 0.277, D / 2 + 0.19), "M_sun", sub=1)
    td.finish()

    el = P("DS_Electronics")
    el.box((0.045, 0.09, 0.13), (L / 2 + 0.022, 0.2, -0.05), "M_ink", b=0.01)
    el.box((0.004, 0.036, 0.075), (L / 2 + 0.046, 0.21, -0.05), "M_sun", b=0.001)
    for dz in (-0.03, 0.0, 0.03):
        el.cyl(0.006, 0.004, (L / 2 + 0.046, 0.172, -0.05 + dz), "M_paper", seg=10, axis="x")
    el.finish()

    an = P("DS_Antenna")
    an.cyl(0.004, 0.12, (L / 2 + 0.022, 0.3, -0.1), "M_ink", seg=8)
    an.ball(0.009, (L / 2 + 0.022, 0.365, -0.1), "M_ink", sub=1)
    an.finish()

    sp = P("DS_SolarPanel")
    px, pz = 0.44, -D / 2 - 0.1
    sp.cyl(0.011, 0.56, (px, 0.28, pz), "M_alu", seg=12)
    sp.cyl(0.04, 0.012, (px, 0.006, pz), "M_alu", seg=16, b=0.003)
    rot = (RAD(28.6), 0, RAD(20))
    pan = Part("_pan", c)
    pan.box((0.36, 0.016, 0.26), (0, 0, 0), "M_alu", b=0.006)
    pan.box((0.34, 0.006, 0.24), (0, 0.007, 0), "M_ink", b=0.002)
    for gx in (-0.085, 0.0, 0.085):
        pan.box((0.004, 0.003, 0.24), (gx, 0.011, 0), "M_alu", b=0.0005)
    pan.box((0.34, 0.003, 0.004), (0, 0.011, 0), "M_alu", b=0.0005)
    bmesh.ops.rotate(pan.bm, verts=pan.bm.verts, cent=(0, 0, 0), matrix=Euler(rot).to_matrix())
    bmesh.ops.translate(pan.bm, verts=pan.bm.verts, vec=T(px, 0.58, pz))
    me = bpy.data.meshes.new("_t")
    pan.bm.to_mesh(me)
    pan.bm.free()
    remap = {i: sp._mi(m) for i, m in enumerate(pan.mats)}
    tmp = bmesh.new()
    tmp.from_mesh(me)
    for f in tmp.faces:
        f.material_index = remap[f.material_index]
    tmp.to_mesh(me)
    tmp.free()
    sp.bm.from_mesh(me)
    bpy.data.meshes.remove(me)
    sp.finish()

    empty("DS_Vapor_Anchor", c, (0, YB + 0.03, 0))
    return c


# ---------------------------------------------------------------- ilha
def squircle(h, r, n=10, jitter=0.0, seed=1.0):
    pts = []
    corners = [((h - r, -h), (h, -h), (h, -h + r)), ((h, h - r), (h, h), (h - r, h)), ((-h + r, h), (-h, h), (-h, h - r)), ((-h, -h + r), (-h, -h), (-h + r, -h))]
    for a, ctrl, b in corners:
        for i in range(n + 1):
            t = i / n
            x = (1 - t) ** 2 * a[0] + 2 * (1 - t) * t * ctrl[0] + t * t * b[0]
            z = (1 - t) ** 2 * a[1] + 2 * (1 - t) * t * ctrl[1] + t * t * b[1]
            pts.append((x, z))
        # um ponto no meio do lado reto, para o jitter ter onde agir
    out = []
    for i, (x, z) in enumerate(pts):
        k = 1 + jitter * math.sin(i * 1.7 + seed) * math.cos(i * 0.61 + seed * 2.3)
        out.append((x * k, z * k))
    return out


def tree(coll, name, p, s=1.0, ipe=False):
    crown = "M_sunSoft" if ipe else "M_leaf"
    t = Part(name, coll)
    t.cyl(0.13, 0.9, (0, 0.45, 0), "M_wood", r2=0.085, seg=10)
    t.ball(0.62, (0, 1.17, 0), crown, scale=(1, 0.92, 1))
    t.ball(0.4, (0.36, 0.88, 0.18), crown if ipe else "M_leafDark")
    t.ball(0.36, (-0.32, 0.94, -0.14), crown)
    t.ball(0.3, (0.02, 1.02, -0.4), crown if ipe else "M_leafDark")
    return t.finish(origin=(0, 0, 0), loc=p, scale=s)


def house(coll, name, p, roof, rot=0.0):
    h = Part(name, coll)
    h.box((1.5, 1.0, 1.2), (0, 0.5, 0), "M_paper", b=0.07, seg=4)
    h.box((1.56, 0.1, 1.26), (0, 0.05, 0), "M_paper2", b=0.03)
    # telhado de duas águas com beiral
    h.prism_x([(-0.78, 0.96), (0.78, 0.96), (0.78, 1.04), (0, 1.62), (-0.78, 1.04)], -0.86, 0.86, roof, b=0.035, seg=3)
    h.box((0.3, 0.52, 0.06), (-0.3, 0.36, 0.61), "M_wood", b=0.02)
    h.ball(0.025, (-0.2, 0.36, 0.65), "M_sunSoft", sub=1)
    h.box((0.36, 0.32, 0.06), (0.32, 0.58, 0.61), "M_water", b=0.02)
    h.box((0.42, 0.05, 0.09), (0.32, 0.4, 0.62), "M_paper2", b=0.012)
    h.box((0.06, 0.32, 0.36), (0.76, 0.58, 0), "M_water", b=0.02)
    h.box((0.2, 0.42, 0.2), (0.42, 1.42, -0.28), "M_paper2", b=0.03)
    return h.finish(origin=(0, 0, 0), loc=p, rot_z=rot)


def build_island():
    c = collection("IS_Island")
    P = lambda n: Part(n, c)
    road = json.load(open(os.path.join(ROOT, "blender/road.json")))

    g = P("IS_Ground")
    g.slab(squircle(6.7, 3.1), 0.0, -0.45, "M_grass", b=0.13, seg=4)
    g.slab(squircle(6.55, 3.0, jitter=0.012, seed=2.0), -0.45, -1.25, "M_cerrado", b=0.14, seg=3)
    g.slab([(x + 0.1, z + 0.1) for x, z in squircle(5.8, 2.7, jitter=0.03, seed=4.0)], -1.25, -2.0, "M_cerradoDark", b=0.16, seg=3)
    g.slab([(x - 0.15, z + 0.2) for x, z in squircle(4.6, 2.2, jitter=0.04, seed=7.0)], -2.0, -2.6, "M_cerrado", b=0.18, seg=3)
    g.finish(origin=(0, 0, 0))

    def ribbon(part, width, y, m):
        vs, fs = [], []
        for i, (x, z, tx, tz) in enumerate(road):
            n = math.hypot(tx, tz)
            sx, sz = tz / n * width / 2, -tx / n * width / 2
            vs += [(x - sx, y, z - sz), (x + sx, y, z + sz)]
            if i:
                a = (i - 1) * 2
                fs.append((a, a + 1, a + 3, a + 2))
        part.raw(vs, fs, m)

    r = P("IS_Road")
    ribbon(r, 0.95, 0.03, "M_road")
    ribbon(r, 0.08, 0.036, "M_cerrado")
    r.finish(origin=(0, 0, 0))

    for i, t in enumerate((0.13, 0.32, 0.5, 0.66)):
        x, z, tx, tz = road[round(t * (len(road) - 1))]
        px, pz = x + tz * 0.85, z - tx * 0.85
        s = P("IS_Sign_%02d" % (i + 1))
        s.cyl(0.045, 0.9, (0, 0.45, 0), "M_wood", seg=10)
        s.box((0.8, 0.44, 0.07), (0, 0.93, 0), "M_paper", b=0.035, seg=4)
        s.box((0.5, 0.05, 0.02), (-0.06, 1.0, 0.04), "M_ink", b=0.008)
        s.box((0.34, 0.05, 0.02), (-0.14, 0.89, 0.04), "M_cerrado" if i == 0 else "M_sunSoft", b=0.008)
        s.finish(origin=(0, 0, 0), loc=(px, 0, pz), rot_z=math.atan2(tx, tz) - math.pi / 2 + 0.5)

    P("IS_Module_Pad").box((3.1, 0.1, 2.3), (-0.15, 0.03, 0.5), "M_paper2", b=0.045, seg=4).finish()
    empty("IS_Module_Slot", c, (0, 0, 0.3))
    for i, p in enumerate(((0, 0, -2.0), (2.9, 0, 0.3), (2.9, 0, -2.0))):
        empty("IS_Module_Slot_%d" % (i + 2), c, p)

    w = P("IS_Well")
    w.cyl(0.78, 0.6, (0, 0.3, 0), "M_paper", r2=0.72, seg=32, b=0.05, bseg=3)
    w.torus(0.66, 0.075, (0, 0.6, 0), "M_paper2", axis="y", seg=32)
    w.cyl(0.58, 0.02, (0, 0.615, 0), "M_ink", seg=32)
    w.cyl(0.55, 0.03, (0, 0.625, 0), "M_brine", seg=32)
    for sx in (-1, 1):
        w.cyl(0.055, 1.5, (sx * 0.66, 0.95, 0), "M_wood", seg=10)
    w.cyl(0.06, 1.6, (0, 1.66, 0), "M_wood", seg=10, axis="x")
    w.prism_x([(-0.34, 1.72), (0.34, 1.72), (0, 2.0)], -0.86, 0.86, "M_wood", b=0.02)
    w.cyl(0.012, 0.62, (0, 1.34, 0), "M_ink", seg=6)
    w.cyl(0.11, 0.24, (0, 0.95, 0), "M_alu", r2=0.15, seg=16, b=0.01)
    w.finish(origin=(0, 0, 0), loc=(-4.3, 0, 1.9))

    wt = P("IS_WaterTower")
    for sx in (-1, 1):
        for sz in (-1, 1):
            wt.cyl(0.07, 2.3, (sx * 0.5, 1.15, sz * 0.5), "M_wood", seg=10)
    for y in (0.8, 1.7):
        for a in range(4):
            ax = "x" if a % 2 == 0 else "z"
            off = (0, y, (0.5 if a == 0 else -0.5)) if ax == "x" else ((0.5 if a == 1 else -0.5), y, 0)
            wt.cyl(0.035, 1.0, off, "M_wood", seg=8, axis=ax)
    wt.box((1.5, 0.12, 1.5), (0, 2.32, 0), "M_wood", b=0.04)
    wt.cyl(0.78, 1.7, (0, 3.24, 0), "M_glass", seg=32)
    for y in (2.46, 4.02):
        wt.torus(0.78, 0.035, (0, y, 0), "M_paper", axis="y", seg=32)
    wt.cyl(0.86, 0.3, (0, 4.2, 0), "M_paper", r2=0.2, seg=32, b=0.03)
    wt.ball(0.09, (0, 4.38, 0), "M_brine", sub=1)
    wt.finish(origin=(0, 0, 0), loc=(-4.4, 0, -3.4))
    P("IS_WaterTower_Fill").cyl(0.72, 1.64, (0, 0.82, 0), "M_water", seg=32).finish(origin=(0, 0, 0), loc=(-4.4, 2.4, -3.4))

    house(c, "IS_House_01", (-1.9, 0, -4.9), "M_brine", 0.15)
    house(c, "IS_House_02", (1.1, 0, -5.1), "M_sunSoft", -0.1)
    house(c, "IS_House_03", (4.6, 0, -4.7), "M_paper2", -0.5)
    house(c, "IS_House_04", (-5.1, 0, -0.7), "M_brine", 0.9)

    trees = [((-3.4, 0, -5.4), 1.05, 0), ((-0.4, 0, -5.8), 0.85, 0), ((2.9, 0, -5.5), 1.1, 0), ((5.6, 0, -2.9), 0.8, 0),
             ((-5.8, 0, -2.7), 0.95, 0), ((-3.0, 0, -3.7), 0.9, 0), ((-2.9, 0, -1.6), 1.15, 1), ((-2.8, 0, 1.4), 0.8, 0),
             ((-1.0, 0, 5.6), 0.9, 0), ((1.4, 0, 5.8), 1.0, 1), ((3.9, 0, 5.5), 0.8, 0), ((5.6, 0, 4.2), 0.7, 0),
             ((-5.3, 0, 5.2), 0.75, 0), ((4.6, 0, 2.2), 0.6, 0)]
    for i, (p, s, ipe) in enumerate(trees):
        tree(c, "IS_Tree_%02d" % (i + 1), p, s, bool(ipe))

    b = P("IS_Bushes")
    for i, (x, z) in enumerate(((-3.6, 3.0), (1.6, 2.7), (-1.6, -3.4), (5.9, 0.9), (-5.9, 3.0), (3.3, -3.9))):
        rr = 0.24 + (i % 3) * 0.06
        b.ball(rr, (x, 0.14, z), "M_leafDark" if i % 2 else "M_cerrado", scale=(1, 0.7, 1))
        if i % 2:
            b.ball(rr * 0.7, (x + rr * 0.8, 0.1, z + 0.1), "M_leaf", scale=(1, 0.7, 1))
    b.finish(origin=(0, 0, 0))

    x, z, _, _ = road[round(0.8 * (len(road) - 1))]
    tr = P("IS_Trophy")
    tr.box((0.6, 0.16, 0.6), (0, 0.08, 0), "M_ink", b=0.04)
    tr.cyl(0.19, 0.05, (0, 0.185, 0), "M_sunSoft", seg=24, b=0.012)
    tr.cyl(0.16, 0.36, (0, 0.38, 0), "M_sunSoft", r2=0.06, seg=24)
    tr.cyl(0.13, 0.5, (0, 0.8, 0), "M_sunSoft", r2=0.36, seg=28, b=0.02)
    tr.torus(0.345, 0.03, (0, 1.05, 0), "M_sunSoft", axis="y", seg=28)
    for sx in (-1, 1):
        tr.torus(0.15, 0.035, (sx * 0.36, 0.84, 0), "M_sunSoft", axis="z", seg=18)
    tr.finish(origin=(0, 0, 0), loc=(x - 0.95, 0.05, z + 0.1))

    x, z, _, _ = road[round(0.93 * (len(road) - 1))]
    md = P("IS_Medal")
    md.box((0.13, 0.62, 0.04), (-0.11, 1.1, 0), "M_brine", b=0.015, rot=(0, RAD(17), 0))
    md.box((0.13, 0.62, 0.04), (0.11, 1.1, 0), "M_brine", b=0.015, rot=(0, RAD(-17), 0))
    md.cyl(0.36, 0.08, (0, 0.62, 0), "M_water", seg=32, axis="z", b=0.02)
    md.cyl(0.22, 0.1, (0, 0.62, 0), "M_paper", seg=28, axis="z", b=0.01)
    md.finish(origin=(0, 0, 0), loc=(x - 1.05, 0.05, z + 0.5))

    bk = P("IS_Bike")
    for zz in (-0.22, 0.22):
        bk.torus(0.13, 0.03, (0, 0.16, zz), "M_ink", axis="x", seg=18)
    bk.box((0.05, 0.05, 0.46), (0, 0.27, 0), "M_brine", b=0.02)
    bk.cyl(0.08, 0.32, (0, 0.52, -0.05), "M_paper", seg=14, b=0.06, bseg=3)
    bk.ball(0.085, (0, 0.78, -0.05), "M_sunSoft")
    bk.finish(origin=(0, 0, 0))

    dr = P("IS_Drone")
    dr.box((0.34, 0.1, 0.22), (0, 0, 0), "M_paper", b=0.04)
    dr.ball(0.05, (0, -0.07, 0.08), "M_water", sub=1)
    for sx in (-1, 1):
        for sz in (-1, 1):
            dr.cyl(0.012, 0.06, (sx * 0.24, 0.04, sz * 0.2), "M_ink", seg=8)
    drone = dr.finish(origin=(0, 0, 0), loc=(-0.5, 4.4, -1.2))
    k = 0
    for sx in (-1, 1):
        for sz in (-1, 1):
            k += 1
            Part("IS_Drone_Rotor_%d" % k, c).box((0.26, 0.012, 0.045), (0, 0, 0), "M_ink", b=0.005).finish(origin=(0, 0, 0), parent=drone).location = T(sx * 0.24, 0.075, sz * 0.2)

    lt = P("IS_LabTable")
    lt.box((40, 0.7, 34), (2, -0.6, 3), "M_table", b=0.3, seg=4)
    lt.cyl(0.13, 3.4, (9.5, -0.12, 8), "M_sunSoft", seg=6, axis="x", rot=(0, 0, RAD(-34)))
    lt.cyl(0.8, 0.5, (-10.5, 0.0, 5.5), "M_paper", seg=32, b=0.06)
    lt.cyl(0.66, 0.02, (-10.5, 0.24, 5.5), "M_brine", seg=32)
    lt.finish(origin=(0, 0, 0))
    return c


def build_all():
    for me in [m for m in bpy.data.meshes if m.users == 0]:
        bpy.data.meshes.remove(me)
    build_module()
    build_island()
    return stats()


def stats():
    dg = bpy.context.evaluated_depsgraph_get()
    out = {}
    for cn in ("DS_Module", "IS_Island"):
        col = bpy.data.collections.get(cn)
        tris = 0
        for o in col.objects:
            if o.type == "MESH":
                o.data.calc_loop_triangles()
                tris += len(o.data.loop_triangles)
        out[cn] = {"objects": len(col.objects), "tris": tris}
    return out


def export_all(draco=False):
    """Exporta os GLB. O Blender em Flatpak não traz a libdraco: a compressão
    Draco é feita depois, no projeto, com `npm run models`."""
    res = {}
    for cn, fn in (("DS_Module", "desol-module.glb"), ("IS_Island", "desol-island.glb")):
        for o in bpy.context.view_layer.objects:
            o.select_set(False)
        for o in bpy.data.collections[cn].objects:
            o.select_set(True)
        path = os.path.join(ROOT, "blender/export", fn)
        os.makedirs(os.path.dirname(path), exist_ok=True)
        bpy.ops.export_scene.gltf(
            filepath=path, export_format="GLB", use_selection=True, export_apply=True, export_yup=True,
            export_draco_mesh_compression_enable=draco, export_draco_mesh_compression_level=6,
            export_cameras=False, export_lights=False, export_animations=False, export_extras=False,
        )
        res[fn] = os.path.getsize(path)
    return res
