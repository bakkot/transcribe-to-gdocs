# Podman

## Setup

Install podman. On Linux that's all you need. On MacOS or Windows, podman runs containers in a Linux VM. The first time you'll need to create it:

```sh
podman machine init --cpus 4 --memory 8192
```

Then start it (again, Mac/Windows only); you'll also need to do this if it's been stopped (e.g. with `podman machine stop` or by restarting your computer):

```sh
podman machine start
```

Upgrading podman can delete the existing VM; if `podman machine start` says it doesn't exist, run the `init` command again.

Create a folder to share with the container (on Mac/Windows this needs to be somewhere [the VM can read](https://man.archlinux.org/man/containers.conf.5.en#MACHINE_TABLE:~:text=Host%20directories%20to%20be%20mounted%20as%20volumes%20into%20the%20VM%20by%20default.), e.g. anywhere under your home directory):

```sh
mkdir -p webtop-files
```

and create/start the container:

```sh
podman run -d --name webtop --shm-size=1gb \
  -e PUID=0 -e PGID=0 \
  -p 127.0.0.1:3001:3001 \
  -v "$PWD/webtop-files":/config \
  lscr.io/linuxserver/webtop:debian-xfce
```

If you haven't previously downloaded the `webtop:debian-xfce` image, this will download a ~4 GB image.

If you've run the above command before, you should instead do `podman start webtop` to start it without recreating.

Then open `https://127.0.0.1:3001` and click through the self-signed certificate warning.

At least on MacOS it's possible for something to be listening on `*:3001` and still have the command succeed, because it's binding `127.0.0.1:3001` exactly, so you may need to ensure you open exactly the above URL. I couldn't figure out a good way to prevent this (lack of) conflict. To use a different port, change the first `3001` in the `-p` option, e.g. `-p 127.0.0.1:3002:3001`.

Continue from the [Inside webtop](README.md#inside-webtop) section of the README.

### Vs docker

This differs from the Docker command in the README in one way: `-e PUID=0 -e PGID=0` runs the desktop as root inside the container. With rootless podman, root in the container is your own user outside it, so files the desktop creates in `webtop-files` are owned by you. Without it they're owned by an arbitrary high-numbered user ID and you can't write into `webtop-files` from outside.

## Getting files in and out

`webtop-files` is the desktop's home directory, so you can just copy files into it:

```sh
cp SONIOX_KEY.txt gdocs-client-oauth-secret.json GENERATED_TOKEN.json webtop-files/live-transcribe-soniox/
```

For files elsewhere in the container, use `podman cp`, which works in both directions:

```sh
podman cp webtop:/tmp/test.wav .
```

## Getting a shell

You can use the terminal in the remote desktop, or get one with:

```sh
podman exec -it -w /config -u abc webtop bash
```

`abc` is the desktop's user (with the `PUID=0` above it's root inside the container, so `sudo` isn't needed, though it works). A shell from `podman exec` has the same audio setup as the desktop, so `rec` works in it.

## Cleaning up

To stop the desktop:

```sh
podman stop webtop
```

On MacOS/Windows you can also stop podman's VM (which also stops the desktop):

```sh
podman machine stop
```

To delete the container entirely:

```sh
podman rm -f webtop
```

The container has your customizations (e.g. anything you `apt-get install`ed) but not the base ~4 GB image. If you want that gone too:

```sh
podman rmi lscr.io/linuxserver/webtop:debian-xfce
```

The `webtop-files` directory is kept; delete it yourself if you're done with it. After `podman rm` you'll need the `podman run` command above to start a new container, and you'll need to reinstall the dependencies with `apt-get`, since those live in the container rather than in `webtop-files`.
