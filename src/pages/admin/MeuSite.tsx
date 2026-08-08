import { Globe } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ImageSlotCard } from '@/components/admin/ImageSlotCard';
import { GalleryManager } from '@/components/admin/GalleryManager';

import logo from '@/assets/logo.png';
import menuIcon from '@/assets/menu-icon.png';
import closeIcon from '@/assets/close-icon.png';
import heroBg from '@/assets/hero-bg.jpg';
import heroMobile from '@/assets/hero-mobile.jpg';
import barbershopFront from '@/assets/barbershop-front-nobg.png';
import barbershopInterior from '@/assets/barbershop-interior.jpg';
import cadeiraChamando from '@/assets/cadeira-chamando.jpeg';

const AdminMeuSite = () => {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Globe className="text-primary" size={28} />
          <div>
            <h1 className="font-display text-2xl md:text-3xl uppercase">Meu site</h1>
            <p className="text-sm text-muted-foreground">
              Troque as imagens do site e da fila. Só aparece o que estiver salvo aqui.
            </p>
          </div>
        </div>

        <Tabs defaultValue="identidade" className="w-full">
          <div className="overflow-x-auto pb-1">
            <TabsList className="w-max">
              <TabsTrigger value="identidade">Identidade</TabsTrigger>
              <TabsTrigger value="hero">Hero</TabsTrigger>
              <TabsTrigger value="sobre">Sobre nós</TabsTrigger>
              <TabsTrigger value="trabalho">Nosso trabalho</TabsTrigger>
              <TabsTrigger value="produtos">Produtos</TabsTrigger>
              <TabsTrigger value="fila">Fila</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="identidade" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <ImageSlotCard
                slot="logo"
                label="Logo"
                description="Menu, rodapé, fila e painel"
                fallback={logo}
                aspect={1}
                aspectLabel="1:1 (quadrada)"
                transparent
                previewClassName="aspect-square"
              />
              <ImageSlotCard
                slot="menu_icon"
                label="Ícone do menu"
                description="Botão que abre o menu no celular"
                fallback={menuIcon}
                aspect={1}
                aspectLabel="1:1"
                transparent
                previewClassName="aspect-square"
              />
              <ImageSlotCard
                slot="close_icon"
                label="Ícone de fechar"
                description="Botão que fecha o menu no celular"
                fallback={closeIcon}
                aspect={1}
                aspectLabel="1:1"
                transparent
                previewClassName="aspect-square"
              />
            </div>
          </TabsContent>

          <TabsContent value="hero" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ImageSlotCard
                slot="hero_desktop"
                label="Imagem principal (computador)"
                fallback={heroBg}
                aspect={16 / 9}
                aspectLabel="16:9"
              />
              <ImageSlotCard
                slot="hero_mobile"
                label="Imagem principal (celular)"
                fallback={heroMobile}
                aspect={9 / 16}
                aspectLabel="9:16 (vertical)"
                previewClassName="aspect-[9/16] max-h-80 mx-auto"
              />
            </div>
          </TabsContent>

          <TabsContent value="sobre" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ImageSlotCard
                slot="about_front"
                label="Fachada da barbearia"
                description="Frente do cartão 3D da seção Sobre nós"
                fallback={barbershopFront}
                aspect={4 / 3}
                aspectLabel="4:3"
                transparent
              />
              <ImageSlotCard
                slot="about_interior"
                label="Interior da barbearia"
                description="Verso do cartão 3D da seção Sobre nós"
                fallback={barbershopInterior}
                aspect={4 / 3}
                aspectLabel="4:3"
              />
            </div>
          </TabsContent>

          <TabsContent value="trabalho" className="mt-4">
            <Card>
              <CardContent className="p-4">
                <GalleryManager
                  gallery="portfolio"
                  title="Nosso trabalho"
                  description="Fotos exibidas no carrossel do site."
                  aspect={4 / 5}
                  aspectLabel="4:5 (vertical)"
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="produtos" className="mt-4">
            <Card>
              <CardContent className="p-4">
                <GalleryManager
                  gallery="produtos"
                  title="Produtos"
                  description="Fotos e nomes dos produtos exibidos na tabela de preços."
                  aspect={1}
                  aspectLabel="1:1 (quadrada)"
                  withText
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="fila" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Imagem da fila</CardTitle>
                <CardDescription>
                  Exibida na visão geral da fila atual quando um cliente é chamado.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="max-w-md">
                  <ImageSlotCard
                    slot="queue_chair"
                    label="Cadeira / imagem de chamada"
                    fallback={cadeiraChamando}
                    aspect={1}
                    aspectLabel="1:1"
                    previewClassName="aspect-square"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminMeuSite;
