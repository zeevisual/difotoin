import { NextRequest, NextResponse } from 'next/server';
import { DEMO_EDITORIAL_PHOTOS } from '@/lib/drive-utils';
import { DrivePhoto } from '@/types/difotoin';

interface GoogleDriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  thumbnailLink?: string;
  webContentLink?: string;
  createdTime?: string;
  imageMediaMetadata?: {
    width?: number;
    height?: number;
    cameraMake?: string;
    cameraModel?: string;
    exposureTime?: number;
    aperture?: number;
    isoSpeed?: number;
  };
}

/**
 * Fallback parser that extracts public image files from Google Drive's public embeddedfolderview
 * when a user pastes a real public Google Drive folder link even before setting GOOGLE_DRIVE_API_KEY.
 */
async function tryFetchPublicEmbeddedDriveFolder(
  folderId: string
): Promise<DrivePhoto[] | null> {
  try {
    const embedUrl = `https://drive.google.com/embeddedfolderview?id=${encodeURIComponent(
      folderId
    )}#list`;
    const res = await fetch(embedUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      next: { revalidate: 60 },
    });

    if (!res.ok) return null;
    const html = await res.text();

    // Match entries in embeddedfolderview: id="entry-<FILE_ID>" ... <div class="flip-entry-title"><FILENAME></div>
    const entryRegex =
      /id="entry-([a-zA-Z0-9_-]+)"[\s\S]*?<div class="flip-entry-title">([^<]+)<\/div>/g;
    const categories: Array<'Outdoor' | 'Studio' | 'Detail & Cincin'> = [
      'Outdoor',
      'Studio',
      'Detail & Cincin',
    ];
    const results: DrivePhoto[] = [];
    let match: RegExpExecArray | null;

    while ((match = entryRegex.exec(html)) !== null) {
      const fileId = match[1];
      const fileName = match[2].trim();
      const isNonImage =
        /\.(mp4|mov|avi|mkv|pdf|zip|rar|doc|docx|xls|xlsx|txt|mp3|wav)$/i.test(
          fileName
        );
      if (isNonImage) continue;

      const idx = results.length;
      results.push({
        id: fileId,
        name: fileName,
        mimeType: 'image/jpeg',
        thumbnailUrl: `https://drive.google.com/thumbnail?id=${fileId}&sz=w1200`,
        fullResUrl: `https://drive.google.com/thumbnail?id=${fileId}&sz=w2200`,
        downloadUrl: `https://drive.google.com/uc?export=download&id=${fileId}`,
        category: categories[idx % categories.length],
        location: 'Sesi Zeevisual',
        capturedAt: '16:30 WIB',
        caption: fileName,
        exif: 'Zeevisual RAW Proof',
        // Orientation will also auto-adjust on client image load
        aspectRatio: idx % 3 === 1 ? 'landscape' : 'portrait',
      });
    }

    return results.length > 0 ? results : null;
  } catch {
    return null;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { folderId: string } }
) {
  const folderId = params.folderId;
  const apiKey = process.env.GOOGLE_DRIVE_API_KEY;
  const strictMode = request.nextUrl.searchParams.get('strict') === '1';

  const isDemoFolder =
    !folderId ||
    folderId.startsWith('demo-') ||
    folderId === '1x9BAidaFauziRAW74Editorial' ||
    folderId === '1y8CDimasSarahWedding74' ||
    folderId === '1z7DRezaKiranaPortrait35mm';

  if (isDemoFolder) {
    if (strictMode) {
      return NextResponse.json({
        source: 'empty-or-private',
        folderId,
        warning:
          'Silakan tempel link folder Google Drive foto Anda sendiri (pastikan akses folder disetel ke "Siapa saja yang memiliki link / Anyone with the link").',
        count: 0,
        photos: [],
      });
    }
    return NextResponse.json({
      source: 'demo-fallback',
      folderId,
      count: DEMO_EDITORIAL_PHOTOS.length,
      photos: DEMO_EDITORIAL_PHOTOS,
    });
  }

  const hasValidApiKey =
    Boolean(apiKey) &&
    apiKey !== 'your-google-drive-api-key' &&
    apiKey!.trim() !== '';

  // 1. Try Official Google Drive API v3 if GOOGLE_DRIVE_API_KEY is configured
  if (hasValidApiKey) {
    try {
      const query = encodeURIComponent(
        `'${folderId}' in parents and mimeType contains 'image/' and trashed = false`
      );
      const fields = encodeURIComponent(
        'files(id,name,mimeType,thumbnailLink,webContentLink,createdTime,imageMediaMetadata)'
      );
      const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=${fields}&orderBy=name&pageSize=200&key=${apiKey}`;

      const response = await fetch(url, {
        next: { revalidate: 60 },
      });

      if (response.ok) {
        const data = (await response.json()) as {
          files?: GoogleDriveFileItem[];
        };
        const files = data.files ?? [];

        if (files.length > 0) {
          const categories: Array<'Outdoor' | 'Studio' | 'Detail & Cincin'> = [
            'Outdoor',
            'Studio',
            'Detail & Cincin',
          ];

          const photos: DrivePhoto[] = files.map((file, index) => {
            const width = file.imageMediaMetadata?.width ?? 4;
            const height = file.imageMediaMetadata?.height ?? 5;
            const aspectRatio: 'portrait' | 'landscape' | 'square' =
              width > height * 1.1
                ? 'landscape'
                : Math.abs(width - height) <= width * 0.12
                  ? 'square'
                  : 'portrait';

            const aperture = file.imageMediaMetadata?.aperture
              ? `f/${file.imageMediaMetadata.aperture}`
              : 'f/2.0';
            const iso = file.imageMediaMetadata?.isoSpeed
              ? `ISO ${file.imageMediaMetadata.isoSpeed}`
              : 'ISO 160';

            return {
              id: file.id,
              name: file.name,
              mimeType: file.mimeType,
              thumbnailUrl: `https://drive.google.com/thumbnail?id=${file.id}&sz=w1200`,
              fullResUrl: `https://drive.google.com/thumbnail?id=${file.id}&sz=w2200`,
              downloadUrl:
                file.webContentLink ||
                `https://drive.google.com/uc?export=download&id=${file.id}`,
              category: categories[index % categories.length],
              location: 'Sesi Zeevisual',
              capturedAt: '16:30 WIB',
              caption: file.name,
              exif: `${aperture} • ${iso}`,
              aspectRatio,
            };
          });

          return NextResponse.json({
            source: 'google-drive-v3',
            folderId,
            count: photos.length,
            photos,
          });
        }
      }
    } catch {
      // Fall through to public folder resolver
    }
  }

  // 2. Try Public Embedded Google Drive Folder Resolver (works without API Key for public folders)
  const publicFolderPhotos = await tryFetchPublicEmbeddedDriveFolder(folderId);
  if (publicFolderPhotos && publicFolderPhotos.length > 0) {
    return NextResponse.json({
      source: 'google-drive-public',
      folderId,
      count: publicFolderPhotos.length,
      photos: publicFolderPhotos,
    });
  }

  // 3. If strictMode is requested (e.g. Photographer Demo Testing), inform user instead of showing generic photos
  if (strictMode) {
    return NextResponse.json({
      source: 'empty-or-private',
      folderId,
      warning:
        'Folder Google Drive belum dibuka ke Publik ("Siapa saja yang memiliki link / Anyone with the link") atau tidak berisi file foto.',
      count: 0,
      photos: [],
    });
  }

  // 4. Fallback to curated mixed portrait/landscape editorial photos
  return NextResponse.json({
    source: 'demo-fallback',
    folderId,
    warning:
      'Folder belum publik atau kosong. Menampilkan foto demo Portrait & Landscape.',
    count: DEMO_EDITORIAL_PHOTOS.length,
    photos: DEMO_EDITORIAL_PHOTOS,
  });
}
